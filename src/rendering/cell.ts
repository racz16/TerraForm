import { mat4, quat, vec3, vec4 } from 'gl-matrix';

import { Entity } from '../scene/entity';
import { createBuffer, BufferUsage, Buffer } from './buffer';
import { camera, options, statistics } from '..';
import { MAT4_ITEM_COUNT, SIZEOF_FLOAT, VEC3_ITEM_COUNT } from '../constants';
import { addToVec3Pool } from '../utility';
import { Renderpass } from './renderpass';
import { Mesh } from './mesh';
import { DrawConfig, createDrawConfig } from './draw-config';
import { INSTANCE_BUFFER_INDEX, instanceLayout } from './layout';
import { getRenderingCapabilities } from './rendering-context';

export class Cell {
    private static M = mat4.create();
    private static q = quat.create();
    private static maxCellDistance = 0;

    private x = 0;
    private z = 0;
    private entities: Entity[] = [];
    private drawConfigs: DrawConfig[] = [];
    private instanceBuffer!: Buffer;
    private valid = false;
    private instanceCount = 0;
    private vertexCount = 0;
    private triangleCount = 0;
    private cornerPoints: vec4[] = [];
    private aabbMin = vec3.create();
    private aabbMax = vec3.create();

    public static updateMaxCellDistance(): void {
        const halfCellSize = options.getCellSize() / 2;
        const halfCellSizeSquared = halfCellSize * halfCellSize;
        Cell.maxCellDistance = Math.sqrt(halfCellSizeSquared + halfCellSizeSquared);
    }

    public static getMaxCellDistance(): number {
        return Cell.maxCellDistance;
    }

    public constructor(entities: Entity[], meshes: Mesh[], x: number, z: number) {
        this.initialize(entities, meshes, x, z);
    }

    public getX(): number {
        return this.x;
    }

    public getZ(): number {
        return this.z;
    }

    public isValid(): boolean {
        return this.valid;
    }

    public initialize(entities: Entity[], meshes: Mesh[], x: number, z: number): void {
        this.x = x;
        this.z = z;
        this.entities = entities;
        this.instanceCount = entities.length;
        this.instanceBuffer = this.createInstanceBuffer(meshes);
        this.createDrawConfigs(meshes);
        this.valid = true;
        statistics.increment('instances', entities.length);
        if (!this.cornerPoints.length) {
            for (let i = 0; i < 8; i++) {
                this.cornerPoints.push(vec4.create());
            }
        }
    }

    private createDrawConfigs(meshes: Mesh[]): void {
        this.vertexCount = 0;
        this.triangleCount = 0;
        let offset = 0;
        for (const mesh of meshes) {
            const entityCount = this.entities.filter((e) => e.mesh === mesh.name).length;
            if (entityCount) {
                const drawConfig = createDrawConfig({
                    mesh,
                    instanceData: {
                        buffer: this.instanceBuffer,
                        index: INSTANCE_BUFFER_INDEX,
                        vertexCount: entityCount,
                        offset: offset * (MAT4_ITEM_COUNT + VEC3_ITEM_COUNT) * SIZEOF_FLOAT,
                        layout: instanceLayout,
                    },
                });
                this.drawConfigs.push(drawConfig);
                this.vertexCount += mesh.vertexBufferDescriptor.vertexCount * entityCount;
                this.triangleCount += (mesh.indexBufferDescriptor.indexCount / 3) * entityCount;
                offset += entityCount;
            }
        }
        statistics.increment('vertices', this.vertexCount);
        statistics.increment('triangles', this.triangleCount);
    }

    private createInstanceBuffer(meshes: Mesh[]): Buffer {
        return createBuffer({
            type: 'data-callback',
            size: this.entities.length * (MAT4_ITEM_COUNT + VEC3_ITEM_COUNT) * SIZEOF_FLOAT,
            callback: (data) => {
                const instanceData = new Float32Array(data);
                let offset = 0;
                for (const mesh of meshes) {
                    const entities = this.entities.filter((e) => e.mesh === mesh.name);
                    if (entities.length) {
                        this.addInstanceData(instanceData, entities, offset);
                        offset += entities.length;
                    }
                }
            },
            usage: BufferUsage.VERTEX,
        });
    }

    private addInstanceData(instanceData: Float32Array, entities: Entity[], offset: number): void {
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const instanceDataStartPosition = (i + offset) * (MAT4_ITEM_COUNT + VEC3_ITEM_COUNT);
            mat4.fromRotationTranslationScale(
                Cell.M,
                quat.fromEuler(Cell.q, entity.rotation[0], entity.rotation[1], entity.rotation[2]),
                entity.position,
                entity.scale
            );
            instanceData.set(Cell.M, instanceDataStartPosition);
            instanceData.set(entity.color, instanceDataStartPosition + MAT4_ITEM_COUNT);
        }
    }

    public render(renderpass: Renderpass): void {
        if (options.isFrustumCulling() && !this.isInFrustum()) {
            return;
        }
        statistics.increment('rendered-cells', 1);
        let offset = 0;
        const instanceOffsetSupported = getRenderingCapabilities().instanceOffset;
        if (instanceOffsetSupported) {
            renderpass.setVertexBufferCommand({
                buffer: this.instanceBuffer,
                index: INSTANCE_BUFFER_INDEX,
                vertexCount: this.entities.length,
                layout: instanceLayout,
            });
        }
        for (const drawConfig of this.drawConfigs) {
            const instanceCount = drawConfig.getInstanceData()?.vertexCount ?? 1;
            renderpass.setDrawConfigCommand({ drawConfig });
            const instanceOffset = instanceOffsetSupported ? offset : 0;
            renderpass.drawInstancedIndexedCommand({
                indexCount: drawConfig.getMesh().indexBufferDescriptor.indexCount,
                instanceCount,
                instanceOffset,
            });
            statistics.increment('rendered-vertices', drawConfig.getMesh().vertexBufferDescriptor.vertexCount * instanceCount);
            statistics.increment('rendered-triangles', (drawConfig.getMesh().indexBufferDescriptor.indexCount / 3) * instanceCount);
            offset += instanceCount;
        }
    }

    public isInFrustum(): boolean {
        this.computeCornerPointsInNdc();
        this.computeAabbMin();
        this.computeAabbMax();
        return (
            this.aabbMin[0] <= 1 &&
            this.aabbMin[1] <= 1 &&
            this.aabbMin[2] <= 1 &&
            this.aabbMax[0] >= -1 &&
            this.aabbMax[1] >= -1 &&
            this.aabbMax[2] >= -1
        );
    }

    private computeCornerPointsInNdc(): void {
        const HALF_SIZE = options.getCellSize() / 2;
        this.worldSpaceToNdc(vec4.set(this.cornerPoints[0], this.x - HALF_SIZE, 0, this.z + HALF_SIZE, 1));
        this.worldSpaceToNdc(vec4.set(this.cornerPoints[1], this.x - HALF_SIZE, HALF_SIZE, this.z + HALF_SIZE, 1));
        this.worldSpaceToNdc(vec4.set(this.cornerPoints[2], this.x + HALF_SIZE, HALF_SIZE, this.z + HALF_SIZE, 1));
        this.worldSpaceToNdc(vec4.set(this.cornerPoints[3], this.x + HALF_SIZE, 0, this.z + HALF_SIZE, 1));
        this.worldSpaceToNdc(vec4.set(this.cornerPoints[4], this.x - HALF_SIZE, 0, this.z - HALF_SIZE, 1));
        this.worldSpaceToNdc(vec4.set(this.cornerPoints[5], this.x - HALF_SIZE, HALF_SIZE, this.z - HALF_SIZE, 1));
        this.worldSpaceToNdc(vec4.set(this.cornerPoints[6], this.x + HALF_SIZE, HALF_SIZE, this.z - HALF_SIZE, 1));
        this.worldSpaceToNdc(vec4.set(this.cornerPoints[7], this.x + HALF_SIZE, 0, this.z - HALF_SIZE, 1));
    }

    private computeAabbMin(): void {
        vec3.set(this.aabbMin, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        for (const point of this.cornerPoints) {
            this.aabbMin[0] = Math.min(this.aabbMin[0], point[0]);
            this.aabbMin[1] = Math.min(this.aabbMin[1], point[1]);
            this.aabbMin[2] = Math.min(this.aabbMin[2], point[2]);
        }
    }

    private computeAabbMax(): void {
        vec3.set(this.aabbMax, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        for (const point of this.cornerPoints) {
            this.aabbMax[0] = Math.max(this.aabbMax[0], point[0]);
            this.aabbMax[1] = Math.max(this.aabbMax[1], point[1]);
            this.aabbMax[2] = Math.max(this.aabbMax[2], point[2]);
        }
    }

    private worldSpaceToNdc(point: vec4): vec4 {
        vec4.transformMat4(point, point, camera.getVP());
        return vec4.scale(point, point, 1 / Math.abs(point[3]));
    }

    public recreate(meshes: Mesh[]): void {
        this.releaseResources();
        this.instanceBuffer = this.createInstanceBuffer(meshes);
        this.createDrawConfigs(meshes);
    }

    public release(): void {
        if (this.valid) {
            for (const drawConfig of this.drawConfigs) {
                const entity = this.entities.find((e) => e.mesh === drawConfig.getMesh().name);
                if (entity) {
                    addToVec3Pool(entity.color);
                }
            }
            for (const entity of this.entities) {
                addToVec3Pool(entity.position);
                addToVec3Pool(entity.rotation);
                addToVec3Pool(entity.scale);
            }
            this.releaseResources();
            this.valid = false;
        }
    }

    private releaseResources(): void {
        this.instanceBuffer.release();
        for (const drawConfig of this.drawConfigs) {
            drawConfig.release();
        }
        this.drawConfigs.length = 0;
        statistics.increment('instances', -this.instanceCount);
        statistics.increment('vertices', -this.vertexCount);
        statistics.increment('triangles', -this.triangleCount);
    }
}
