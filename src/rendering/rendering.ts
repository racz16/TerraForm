import { vec3 } from 'gl-matrix';

import { createBuffer, BufferUsage, Buffer } from './buffer';
import { CommandBuffer, createCommandBuffer } from './command-buffer';
import { Pipeline, createPipeline } from './pipeline';
import { createShader } from './shader';
import { TimeQuery, createTimeQuery } from './time-query';
import { addCubeMesh, addQuadMesh } from './generated-mesh';
import { Cell } from './cell';
import { RenderingApiOption } from '../options';
import { Entity } from '../scene/entity';
import { camera, cellsDebugUi, options, rendering, statistics, time } from '..';
import { ApiError, RenderingContext, createRenderingContext, getRenderingCapabilities } from './rendering-context';
import { MAT4_ITEM_COUNT, SIZEOF_FLOAT, VEC3_ITEM_COUNT } from '../constants';
import { Camera } from '../camera';
import { Texture, createTexture } from './texture';
import { Renderpass } from './renderpass';
import { Mesh } from './mesh';
import { DrawConfig, createDrawConfig } from './draw-config';
import { instanceLayout, vertexLayout, VERTEX_BUFFER_INDEX } from './layout';

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
    private recreating = false;
    private canvas!: HTMLCanvasElement;
    private createCell!: (x: number, z: number) => Entity[];
    private lambertianPipeline!: Pipeline;
    private quadPipeline!: Pipeline;
    private query?: TimeQuery;
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
    private canvasDrawConfig!: DrawConfig;

    public getRenderingApi(): RenderingApi {
        return this.renderingApi;
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
                    cell.recreate(this.meshes);
                }
                if (DEVELOPMENT) {
                    console.log('Rendering initialized');
                }
                return;
            } catch (e) {
                if (!(e instanceof ApiError)) {
                    console.error(e);
                }
            }
        }
        throw new Error('No rendering API is available');
    }

    private async createResources(): Promise<void> {
        this.context = await createRenderingContext();
        if (!getRenderingCapabilities().instancedRendering) {
            throw new Error('Instanced rendering is not supported');
        }
        if (!getRenderingCapabilities().depthTexture) {
            throw new Error('Depth textures are not supported');
        }
        const lambertianPipelinePromise = this.createLambertianPipeline();
        const quadPipelinePromise = this.createQuadPipeline();
        this.createQuery();
        this.createMeshes();
        this.createUniformBuffer();
        this.recreateRenderpassAttachments();
        this.createCanvasDrawConfig();
        this.lambertianPipeline = await lambertianPipelinePromise;
        this.quadPipeline = await quadPipelinePromise;
        if (DEVELOPMENT) {
            console.log('Pipeline created');
        }
    }

    private createCanvasDrawConfig(): void {
        const quadMesh = this.meshes.find((m) => m.name === 'quad');
        if (!quadMesh) {
            throw new Error("Couldn't find quad mesh");
        }
        this.canvasDrawConfig = createDrawConfig({
            mesh: quadMesh,
        });
    }

    private getCanvasElement(): HTMLCanvasElement {
        if (DEVELOPMENT) {
            console.groupCollapsed('Canvas');
        }
        const canvas = document.querySelector('canvas');
        try {
            if (!canvas) {
                throw new Error("Couldn't find the canvas element");
            }
        } finally {
            if (DEVELOPMENT) {
                console.log('Canvas found');
                console.groupEnd();
            }
        }
        return canvas;
    }

    public addMesh(name: string, vertexBuffer: Buffer, indexBuffer: Buffer, vertexCount: number, indexCount: number): void {
        this.vertexBuffers.push(vertexBuffer);
        this.indexBuffers.push(indexBuffer);
        const mesh: Mesh = {
            name,
            vertexBufferDescriptor: {
                buffer: vertexBuffer,
                index: VERTEX_BUFFER_INDEX,
                vertexCount,
                layout: vertexLayout,
            },
            indexBufferDescriptor: {
                buffer: indexBuffer,
                indexCount,
            },
        };
        this.meshes.push(mesh);
    }

    private async createLambertianPipeline(): Promise<Pipeline> {
        const shader = createShader({
            name: 'lambertian',
            vertexBufferLayouts: [vertexLayout, instanceLayout],
            label: 'lambertian shader',
        });
        return createPipeline({
            label: 'lambertian pipeline',
            shader: shader,
            vertexBufferLayouts: [vertexLayout, instanceLayout],
            attachmentFormats: ['rgba8'],
            depthAttachment: true,
        });
    }

    private async createQuadPipeline(): Promise<Pipeline> {
        const shader = createShader({ name: 'quad', vertexBufferLayouts: [vertexLayout], label: 'quad shader' });
        return createPipeline({
            label: 'quad pipeline',
            shader: shader,
            vertexBufferLayouts: [vertexLayout],
            attachmentFormats: ['canvas'],
        });
    }

    private createQuery(): void {
        if (getRenderingCapabilities().gpuTimer) {
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
        if (getRenderingCapabilities().uniformBuffer) {
            const bufferPadding = SIZEOF_FLOAT;
            this.uniformBuffer = createBuffer({
                type: 'size',
                size: (MAT4_ITEM_COUNT + VEC3_ITEM_COUNT) * SIZEOF_FLOAT + bufferPadding,
                usage: BufferUsage.UNIFORM,
                dynamic: true,
            });
            const dataPadding = 1;
            this.uniformBufferData = new Float32Array(MAT4_ITEM_COUNT + VEC3_ITEM_COUNT + dataPadding);
            if (DEVELOPMENT) {
                console.log('Uniform buffer created');
            }
        }
    }

    public async render(): Promise<void> {
        this.clearPerFrameStatistics();
        if (this.recreating) {
            await this.handleRecreation();
        }
        this.handleResize();
        this.renderScene();
        this.renderToCanvas();
        this.commandBuffer.execute();
    }

    private renderScene(): void {
        if (DEVELOPMENT && getRenderingCapabilities().debugGroups) {
            this.lambertianRenderpass.pushDebugGroupCommand('frame');
        }
        this.lambertianRenderpass.setPipelineCommand(this.lambertianPipeline);
        this.updateCells();
        this.updateUniforms();
        this.renderCells();
        if (DEVELOPMENT && getRenderingCapabilities().debugGroups) {
            this.lambertianRenderpass.popDebugGroupCommand();
        }
    }

    private renderToCanvas(): void {
        const quadMesh = this.meshes.find((m) => m.name === 'quad');
        if (!quadMesh) {
            throw new Error("Couldn't find quad mesh");
        }
        this.quadRenderpass.setPipelineCommand(this.quadPipeline);
        this.quadRenderpass.setDrawConfigCommand({ drawConfig: this.canvasDrawConfig });
        this.quadRenderpass.setUniformTextureCommand({ name: 'image', value: this.color!, index: 0 });
        this.quadRenderpass.drawIndexedCommand(quadMesh.indexBufferDescriptor.indexCount);
    }

    private async handleRecreation(): Promise<void> {
        await this.release();
        const newCanvas = document.createElement('canvas');
        this.canvas.replaceWith(newCanvas);
        this.canvas = newCanvas;
        await this.initializeWithApi();
        this.recreating = false;
    }

    private handleResize(): void {
        if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            cellsDebugUi.recreate();
            camera.invalidate();
            this.recreateRenderpassAttachments();
        }
    }

    private recreateRenderpassAttachments(): void {
        this.color?.release();
        this.depth?.release();
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
        this.lambertianRenderpass?.release();
        this.quadRenderpass?.release();
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

    private updateCells(): void {
        if (DEVELOPMENT && getRenderingCapabilities().debugGroups) {
            this.lambertianRenderpass.pushDebugGroupCommand('update cells');
        }
        this.removeCells();
        this.addCells();
        if (DEVELOPMENT && getRenderingCapabilities().debugGroups) {
            this.lambertianRenderpass.popDebugGroupCommand();
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
        const cell = this.cellsPool.pop();
        if (cell) {
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

    private renderCells(): void {
        if (DEVELOPMENT && getRenderingCapabilities().debugGroups) {
            this.lambertianRenderpass.pushDebugGroupCommand('render cells');
        }
        statistics.set('cells', this.cells.length);
        for (const cell of this.cells) {
            cell.render(this.lambertianRenderpass);
        }
        if (DEVELOPMENT && getRenderingCapabilities().debugGroups) {
            this.lambertianRenderpass.popDebugGroupCommand();
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

    private updateUniforms(): void {
        if (DEVELOPMENT && getRenderingCapabilities().debugGroups) {
            this.lambertianRenderpass.pushDebugGroupCommand('update uniforms');
        }
        vec3.normalize(this.lightDirection, vec3.set(this.lightDirection, -1, -2, -3));
        if (getRenderingCapabilities().uniformBuffer) {
            this.uniformBufferData.set(camera.getVP(), 0);
            this.uniformBufferData.set(this.lightDirection, MAT4_ITEM_COUNT);
            this.uniformBuffer.setData({ type: 'buffer', data: this.uniformBufferData });
            this.lambertianRenderpass.setUniformBufferCommand({
                index: 0,
                name: 'FrameData',
                value: this.uniformBuffer,
            });
        } else {
            this.lambertianRenderpass.setUniformMat4Command({ name: 'VP', value: camera.getVP() });
            this.lambertianRenderpass.setUniformVec3Command({ name: 'light', value: this.lightDirection });
        }
        if (DEVELOPMENT && getRenderingCapabilities().debugGroups) {
            this.lambertianRenderpass.popDebugGroupCommand();
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

    public recreate(): void {
        this.recreating = true;
    }

    public removeAllCells(): void {
        for (const cell of this.cells) {
            cell.release();
        }
        this.cells.length = 0;
    }

    public async release(): Promise<void> {
        await this.context.stop();
        if (getRenderingCapabilities().gpuTimer) {
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
        this.canvasDrawConfig.release();
        this.indexBuffers.length = 0;
        this.uniformBuffer?.release();
        this.lambertianRenderpass.release();
        this.quadRenderpass.release();
        this.depth?.release();
        this.color?.release();
        this.quadPipeline.getShader().release();
        this.lambertianPipeline.getShader().release();
        this.context.release();
        if (DEVELOPMENT) {
            console.log('Rendering released');
        }
    }
}
