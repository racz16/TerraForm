import { vec3 } from 'gl-matrix';

import { createBuffer, BufferUsage, Buffer } from './buffer';
import { CommandBuffer, createCommandBuffer } from './command-buffer';
import { Pipeline, VertexAttributeFormat, createPipeline } from './pipeline';
import { createShader } from './shader';
import { RenderingCapabilities } from './rendering-capabilities';
import { TimeQuery, createTimeQuery } from './time-query';
import { Mesh, addCubeMesh, addQuadMesh } from '../scene/mesh';
import { Cell } from './cell';
import { RenderingApiOption } from '../options';
import { Entity } from '../scene/entity';
import { camera, cellsDebugUi, options, rendering, statistics, time } from '..';
import { RenderingContext, createRenderingContext } from './rendering-context';
import { MAT4_ITEM_COUNT, SIZEOF_FLOAT, VEC2_ITEM_COUNT, VEC3_ITEM_COUNT, VEC4_ITEM_COUNT } from '../constants';
import { Camera } from '../camera';
import { Texture, createTexture } from './texture';
import { Renderpass } from './renderpass';

export enum RenderingApi {
    WEBGL_1 = 1,
    WEBGL_2 = 2,
    WEBGPU = 3,
}

export function toStringRenderingApi(api: RenderingApi): string {
    switch (api) {
        case RenderingApi.WEBGL_1:
            return 'WebGL 1';
        case RenderingApi.WEBGL_2:
            return 'WebGL 2';
        case RenderingApi.WEBGPU:
            return 'WebGPU';
    }
}

export function isWebGL1(): boolean {
    return rendering.getRenderingApi() === RenderingApi.WEBGL_1;
}

export function isWebGL2(): boolean {
    return rendering.getRenderingApi() === RenderingApi.WEBGL_2;
}

export function isWebGPU(): boolean {
    return rendering.getRenderingApi() === RenderingApi.WEBGPU;
}

export class Rendering {
    private renderingApi!: RenderingApi;
    private restarted = false;
    private canvas!: HTMLCanvasElement;
    private createCell!: (x: number, z: number) => Entity[];
    private lambertianPipeline!: Pipeline;
    private quadPipeline!: Pipeline;
    private query: TimeQuery | undefined;
    private vertexBuffers: Buffer[] = [];
    private indexBuffers: Buffer[] = [];
    private meshes: Mesh[] = [];
    private uniformBuffer!: Buffer;
    private uniformBufferData!: Float32Array;
    private lightDirection = vec3.create();
    private cells: Cell[] = [];
    private context!: RenderingContext;
    private cellsPool: Cell[] = [];
    private color?: Texture;
    private depth?: Texture;
    private commandBuffer!: CommandBuffer;
    private lambertianRenderpass!: Renderpass;
    private quadRenderpass!: Renderpass;
    private capabilities: RenderingCapabilities = {
        gpuTimer: false,
        uniformBuffer: false,
        instancedRendering: false,
        isNdcCube: true,
        debugGroups: false,
        instanceOffset: false,
        depthTexture: false,
        uvUp: true,
    };

    public getRenderingApi(): RenderingApi {
        return this.renderingApi;
    }

    public getCapabilities(): RenderingCapabilities {
        return this.capabilities;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }

    public getContext(): RenderingContext {
        return this.context;
    }

    public async initialize(createCellCallback: (x: number, z: number) => Entity[]): Promise<void> {
        this.createCell = createCellCallback;
        await this.initializeWithApi();
    }

    private getApiList(): RenderingApi[] {
        const api = options.getRenderingApi();
        switch (api) {
            case RenderingApiOption.WEBGPU:
                return [RenderingApi.WEBGPU];
            case RenderingApiOption.WEBGL_2:
                return [RenderingApi.WEBGL_2];
            case RenderingApiOption.WEBGL_1:
                return [RenderingApi.WEBGL_1];
            default:
                return [RenderingApi.WEBGPU, RenderingApi.WEBGL_2, RenderingApi.WEBGL_1];
        }
    }

    private async initializeWithApi(apis = this.getApiList()): Promise<void> {
        this.canvas = this.getCanvasElement();
        for (const api of apis) {
            try {
                this.renderingApi = api;
                await this.createResources();
                for (const cell of this.cells) {
                    cell.reset();
                }
                if (DEVELOPMENT) {
                    console.log('Rendering initialized');
                }
                return;
            } catch (e) {
                continue;
            }
        }
        throw new Error('No rendering API is available');
    }

    private async createResources(): Promise<void> {
        this.context = await createRenderingContext();
        if (!this.capabilities.instancedRendering) {
            throw new Error('Instanced rendering is not supported');
        }
        if (!this.capabilities.depthTexture) {
            throw new Error('Depth textures are not supported');
        }
        const lambertianPipelinePromise = this.createLambertianPipeline();
        const quadPipelinePromise = this.createQuadPipeline();
        this.createQuery();
        this.createMeshes();
        this.createUniformBuffer();
        this.recreateRenderpassAttachments();
        this.lambertianPipeline = await lambertianPipelinePromise;
        this.quadPipeline = await quadPipelinePromise;
        if (DEVELOPMENT) {
            console.log('Pipeline created');
        }
    }

    private getCanvasElement(): HTMLCanvasElement {
        if (DEVELOPMENT) {
            console.groupCollapsed('Canvas');
        }
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            throw new Error("Couldn't find the canvas element");
        }
        if (DEVELOPMENT) {
            console.log('Canvas found');
            console.groupEnd();
        }
        return canvas;
    }

    public addMesh(name: string, vertexBuffer: Buffer, indexBuffer: Buffer, vertexCount: number, indexCount: number): void {
        this.vertexBuffers.push(vertexBuffer);
        this.indexBuffers.push(indexBuffer);
        this.meshes.push({
            name,
            vertexBufferIndex: this.vertexBuffers.length - 1,
            indexBufferIndex: this.indexBuffers.length - 1,
            vertexCount,
            indexCount,
        });
    }

    private async createLambertianPipeline(): Promise<Pipeline> {
        const shader = createShader({ name: 'lambertian', label: 'lambertian shader' });
        const vertexPositionIndex = 0;
        const vertexNormalIndex = 1;
        const instanceModelMatrixIndex = 3;
        const instanceColorIndex = 7;
        return createPipeline({
            label: 'lambertian pipeline',
            shader: shader,
            vertexBuffers: [
                {
                    stride: (2 * VEC3_ITEM_COUNT + VEC2_ITEM_COUNT) * SIZEOF_FLOAT,
                    isInstanced: false,
                    attributes: [
                        {
                            index: vertexPositionIndex,
                            offset: 0,
                            format: VertexAttributeFormat.FLOAT_3,
                        },
                        {
                            index: vertexNormalIndex,
                            offset: VEC3_ITEM_COUNT * SIZEOF_FLOAT,
                            format: VertexAttributeFormat.FLOAT_3,
                        },
                    ],
                },
                {
                    stride: (MAT4_ITEM_COUNT + VEC3_ITEM_COUNT) * SIZEOF_FLOAT,
                    isInstanced: true,
                    attributes: [
                        {
                            index: instanceModelMatrixIndex,
                            offset: 0,
                            format: VertexAttributeFormat.FLOAT_4,
                        },
                        {
                            index: instanceModelMatrixIndex + 1,
                            offset: VEC4_ITEM_COUNT * SIZEOF_FLOAT,
                            format: VertexAttributeFormat.FLOAT_4,
                        },
                        {
                            index: instanceModelMatrixIndex + 2,
                            offset: 2 * VEC4_ITEM_COUNT * SIZEOF_FLOAT,
                            format: VertexAttributeFormat.FLOAT_4,
                        },
                        {
                            index: instanceModelMatrixIndex + 3,
                            offset: 3 * VEC4_ITEM_COUNT * SIZEOF_FLOAT,
                            format: VertexAttributeFormat.FLOAT_4,
                        },
                        {
                            index: instanceColorIndex,
                            offset: MAT4_ITEM_COUNT * SIZEOF_FLOAT,
                            format: VertexAttributeFormat.FLOAT_3,
                        },
                    ],
                },
            ],
            attachmentFormats: ['rgba8'],
            depthAttachment: true,
        });
    }

    private async createQuadPipeline(): Promise<Pipeline> {
        const shader = createShader({ name: 'quad', label: 'quad shader' });
        const vertexPositionIndex = 0;
        const vertexTextureCoordinateIndex = 2;
        return createPipeline({
            label: 'quad pipeline',
            shader: shader,
            vertexBuffers: [
                {
                    stride: (2 * VEC3_ITEM_COUNT + VEC2_ITEM_COUNT) * SIZEOF_FLOAT,
                    isInstanced: false,
                    attributes: [
                        {
                            index: vertexPositionIndex,
                            offset: 0,
                            format: VertexAttributeFormat.FLOAT_3,
                        },
                        {
                            index: vertexTextureCoordinateIndex,
                            offset: 2 * VEC3_ITEM_COUNT * SIZEOF_FLOAT,
                            format: VertexAttributeFormat.FLOAT_2,
                        },
                    ],
                },
            ],
            attachmentFormats: ['canvas'],
        });
    }

    private createQuery(): void {
        if (this.capabilities.gpuTimer) {
            this.query = createTimeQuery({
                label: 'gpu timer query',
                handler: (elapsed) => {
                    time.addElapsedGpuTime(elapsed);
                },
            });
        }
        if (DEVELOPMENT) {
            console.log('Timer query created');
        }
    }

    private createMeshes(): void {
        addQuadMesh();
        addCubeMesh();
        statistics.set('meshes', this.meshes.length);
        if (DEVELOPMENT) {
            console.log('Meshes created');
        }
    }

    private createUniformBuffer(): void {
        if (this.capabilities.uniformBuffer) {
            const padding = SIZEOF_FLOAT;
            this.uniformBuffer = createBuffer({
                type: 'size',
                size: MAT4_ITEM_COUNT * SIZEOF_FLOAT + VEC3_ITEM_COUNT * SIZEOF_FLOAT + padding,
                usage: BufferUsage.UNIFORM,
                dynamic: true,
            });
        }
        const padding = 1;
        this.uniformBufferData = new Float32Array(MAT4_ITEM_COUNT + VEC3_ITEM_COUNT + padding);
        if (DEVELOPMENT) {
            console.log('Uniform buffer created');
        }
    }

    public async render(): Promise<void> {
        this.clearPerFrameStatistics();
        if (this.restarted) {
            await this.handleRestart();
        }
        this.handleResize();
        this.renderScene();
        this.renderToCanvas();
        this.commandBuffer.execute();
    }

    private renderScene(): void {
        if (DEVELOPMENT && this.capabilities.debugGroups) {
            this.lambertianRenderpass.pushDebugGroupCommand('frame');
        }
        this.lambertianRenderpass.setPipelineCommand(this.lambertianPipeline);
        this.updateCells(this.lambertianRenderpass);
        this.updateUniforms(this.lambertianRenderpass);
        this.renderCells(this.lambertianRenderpass);
        if (DEVELOPMENT && this.capabilities.debugGroups) {
            this.lambertianRenderpass.popDebugGroupCommand();
        }
    }

    private renderToCanvas(): void {
        const quadMesh = this.meshes.find((m) => m.name === 'quad');
        if (!quadMesh) {
            throw new Error("Couldn't find quad mesh");
        }
        this.quadRenderpass.setPipelineCommand(this.quadPipeline);
        this.quadRenderpass.setVertexBufferCommand({ vertexBuffer: this.vertexBuffers[quadMesh.vertexBufferIndex], index: 0 });
        this.quadRenderpass.setIndexBufferCommand(this.indexBuffers[quadMesh.indexBufferIndex]);
        this.quadRenderpass.setUniformTextureCommand({ name: 'image', value: this.color!, index: 0 });
        this.quadRenderpass.drawIndexedCommand(quadMesh.indexCount);
    }

    private async handleRestart(): Promise<void> {
        await this.release();
        const newCanvas = this.canvas.cloneNode(false) as HTMLCanvasElement;
        this.canvas.replaceWith(newCanvas);
        this.canvas = newCanvas;
        await this.initializeWithApi();
        this.restarted = false;
    }

    private handleResize(): void {
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            cellsDebugUi.update();
            camera.invalidate();
            this.recreateRenderpassAttachments();
        }
    }

    private recreateRenderpassAttachments(): void {
        if (this.color) {
            this.color.release();
        }
        if (this.depth) {
            this.depth.release();
        }
        this.color = createTexture({
            type: '2d',
            format: 'rgba8',
            width: this.canvas.clientWidth,
            height: this.canvas.clientHeight,
            rendered: true,
            sampled: true,
            label: 'color buffer',
        });
        this.depth = createTexture({
            type: '2d',
            format: 'depth',
            width: this.canvas.clientWidth,
            height: this.canvas.clientHeight,
            rendered: true,
            label: 'depth buffer',
        });
        if (this.lambertianRenderpass) {
            this.lambertianRenderpass.release();
        }
        if (this.quadRenderpass) {
            this.quadRenderpass.release();
        }
        this.commandBuffer = createCommandBuffer('default command buffer');
        this.lambertianRenderpass = this.commandBuffer.createRenderpass({
            type: 'offscreen',
            colorAttachments: [
                {
                    texture: this.color,
                    clearColor: [0.7, 0.8, 1, 1],
                },
            ],
            depthStencilAttachment: {
                texture: this.depth,
                clearValue: 1,
            },
            label: 'lambertian renderpass',
            query: this.query,
        });
        this.quadRenderpass = this.commandBuffer.createRenderpass({
            type: 'canvas',
            label: 'canvas renderpass',
        });
    }

    private updateCells(renderpass: Renderpass): void {
        if (DEVELOPMENT && this.capabilities.debugGroups) {
            renderpass.pushDebugGroupCommand('update cells');
        }
        this.removeCells();
        this.addCells();
        if (DEVELOPMENT && this.capabilities.debugGroups) {
            renderpass.popDebugGroupCommand();
        }
    }

    private removeCells(): void {
        this.cells
            .filter((c) => !this.isCellInRange(c.getX(), c.getZ()))
            .forEach((c) => {
                c.release();
                this.cellsPool.push(c);
            });
        this.cells = this.cells.filter((c) => c.isValid());
    }

    private addCells(): void {
        const cellSize = options.getCellSize();
        const cameraPosition = camera.getPosition();
        const cameraCellCenterX = Math.round(cameraPosition[0] / cellSize) * cellSize;
        const cameraCellCenterZ = Math.round(cameraPosition[2] / cellSize) * cellSize;
        const maxFrustumDistance = Camera.getMaxFrustumDistance();
        const halfGridSize = Math.round(maxFrustumDistance / cellSize) + 2;
        let i = 0;
        for (let z = -halfGridSize; z <= halfGridSize; z++) {
            for (let x = -halfGridSize; x <= halfGridSize; x++) {
                const cellCenterX = cameraCellCenterX + x * cellSize;
                const cellCenterZ = cameraCellCenterZ + z * cellSize;
                const cellInRange = this.isCellInRange(cellCenterX, cellCenterZ);
                if (this.cells.every((c) => c.getX() !== cellCenterX || c.getZ() !== cellCenterZ) && cellInRange) {
                    const cell = this.getCell(cellCenterX, cellCenterZ);
                    this.cells.push(cell);
                }
                this.updateCellsDebugger(i, x, z, cellCenterX, cellCenterZ, cellInRange);
                i++;
            }
        }
    }

    private getCell(cellCenterX: number, cellCenterZ: number): Cell {
        if (this.cellsPool.length) {
            const cell = this.cellsPool.pop()!;
            cell.initialize(this.createCell(cellCenterX, cellCenterZ), this.meshes, cellCenterX, cellCenterZ);
            return cell;
        } else {
            return new Cell(this.createCell(cellCenterX, cellCenterZ), this.meshes, cellCenterX, cellCenterZ);
        }
    }

    private updateCellsDebugger(i: number, x: number, z: number, cellCenterX: number, cellCenterZ: number, cellInRange: boolean): void {
        if (options.isCellsDebugger()) {
            if (cellInRange) {
                const cell = this.cells.find((c) => c.getX() === cellCenterX && c.getZ() === cellCenterZ);
                if (cell) {
                    if (options.isFrustumCulling() && cell.isInFrustum()) {
                        cellsDebugUi.setCellState(i, 'in-frustum');
                    } else {
                        cellsDebugUi.setCellState(i, 'in-range');
                    }
                }
            } else {
                cellsDebugUi.setCellState(i, 'out-of-range');
            }
            if (x === 0 && z === 0) {
                cellsDebugUi.setCellState(i, 'camera');
            }
        }
    }

    private renderCells(renderpass: Renderpass): void {
        if (DEVELOPMENT && this.capabilities.debugGroups) {
            renderpass.pushDebugGroupCommand('render cells');
        }
        statistics.set('cells', this.cells.length);
        for (const cell of this.cells) {
            cell.render(renderpass, this.vertexBuffers, this.indexBuffers);
        }
        if (DEVELOPMENT && this.capabilities.debugGroups) {
            renderpass.popDebugGroupCommand();
        }
    }

    private clearPerFrameStatistics(): void {
        statistics.set('api-calls', 0);
        statistics.set('draw-calls', 0);
        statistics.set('rendered-cells', 0);
        statistics.set('rendered-instances', 0);
        statistics.set('rendered-vertices', 0);
        statistics.set('rendered-triangles', 0);
    }

    private updateUniforms(renderpass: Renderpass): void {
        if (DEVELOPMENT && this.capabilities.debugGroups) {
            renderpass.pushDebugGroupCommand('update uniforms');
        }
        vec3.normalize(this.lightDirection, vec3.set(this.lightDirection, -1, -2, -3));
        if (this.capabilities.uniformBuffer) {
            this.uniformBufferData.set(camera.getVP(), 0);
            this.uniformBufferData.set(this.lightDirection, MAT4_ITEM_COUNT);
            this.uniformBuffer.setData({ type: 'buffer', data: this.uniformBufferData });
            renderpass.setUniformBufferCommand({
                index: 0,
                name: 'FrameData',
                value: this.uniformBuffer,
            });
        } else {
            renderpass.setUniformMat4Command({ name: 'VP', value: camera.getVP() });
            renderpass.setUniformVec3Command({ name: 'light', value: this.lightDirection });
        }
        if (DEVELOPMENT && this.capabilities.debugGroups) {
            renderpass.popDebugGroupCommand();
        }
    }

    private isCellInRange(x: number, z: number): boolean {
        const maxFrustumDistance = Camera.getMaxFrustumDistance();
        const maxCellDistance = Cell.getMaxCellDistance();
        const cameraPosition = camera.getPosition();
        const distanceX = x - cameraPosition[0];
        const distanceZ = z - cameraPosition[2];
        return Math.sqrt(distanceX * distanceX + distanceZ * distanceZ) <= maxFrustumDistance + maxCellDistance;
    }

    public restart(): void {
        this.restarted = true;
    }

    public removeAllCells(): void {
        for (const cell of this.cells) {
            cell.release();
        }
        this.cells.length = 0;
    }

    public async release(): Promise<void> {
        await this.context.stop();
        if (this.capabilities.gpuTimer) {
            this.query?.release();
        }
        this.meshes.length = 0;
        for (const vb of this.vertexBuffers) {
            vb.release();
        }
        this.vertexBuffers.length = 0;
        for (const ib of this.indexBuffers) {
            ib.release();
        }
        this.indexBuffers.length = 0;
        this.uniformBuffer?.release();
        this.lambertianRenderpass.release();
        this.quadRenderpass.release();
        this.depth?.release();
        this.color?.release();
        this.quadPipeline.getDescriptor().shader.release();
        this.lambertianPipeline.getDescriptor().shader.release();
        this.context.release();
        if (DEVELOPMENT) {
            console.log('Rendering released');
        }
    }
}
