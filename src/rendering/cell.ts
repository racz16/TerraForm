import { mat4, quat, vec3, vec4 } from 'gl-matrix';

import { Entity } from '../scene/entity';
import { Mesh } from '../scene/mesh';
import { createBuffer, BufferUsage, Buffer } from './buffer';
import { CommandBuffer } from './command-buffer';
import { camera, options, rendering, statistics } from '..';
import { MAT4_ITEM_COUNT, SIZEOF_FLOAT, VEC3_ITEM_COUNT } from '../constants';
import { addToVec3Pool } from '../utility';

export class Cell {
    private static M = mat4.create();
    private static defaultRotation = quat.fromEuler(quat.create(), 0, 0, 0);
    private static maxCellDistance = 0;

    private x = 0;
    private z = 0;
    private scene = new Map<Mesh, Entity[]>();
    private entityCount = 0;
    private instanceBuffer!: Buffer;
    private valid = false;
    private instanceCount = 0;
    private vertexCount = 0;
    private triangleCount = 0;
    private cornerPoints: vec4[] = [];
    private aabbMin = vec3.create();
    private aabbMax = vec3.create();

    private static updateMaxCellDistance(): void {
        const halfCellSize = options.getCellSize() / 2;
        const halfCellSizeSquared = halfCellSize * halfCellSize;
        Cell.maxCellDistance = Math.sqrt(halfCellSizeSquared + halfCellSizeSquared);
    }

    public static getMaxCellDistance(): number {
        return Cell.maxCellDistance;
    }

    public constructor(scene: Entity[], meshes: Mesh[], x: number, z: number) {
        this.initialize(scene, meshes, x, z);
    }

    public initialize(scene: Entity[], meshes: Mesh[], x: number, z: number): void {
        this.x = x;
        this.z = z;
        this.entityCount = scene.length;
        this.scene.clear();
        for (const mesh of meshes) {
            this.scene.set(
                mesh,
                scene.filter((e) => e.mesh === mesh.name)
            );
        }
        this.instanceBuffer = this.createInstanceBuffer();
        this.valid = true;
        this.instanceCount = scene.length;
        statistics.increment('instances', scene.length);
        this.vertexCount = 0;
        this.triangleCount = 0;
        for (const [mesh, entities] of this.scene) {
            this.vertexCount += mesh.vertexCount * entities.length;
            this.triangleCount += (mesh.indexCount / 3) * entities.length;
        }
        Cell.updateMaxCellDistance();
        if (!this.cornerPoints.length) {
            for (let i = 0; i < 8; i++) {
                this.cornerPoints.push(vec4.create());
            }
        }
        statistics.increment('vertices', this.vertexCount);
        statistics.increment('triangles', this.triangleCount);
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

    private createInstanceBuffer(): Buffer {
        return createBuffer({
            type: 'data-callback',
            size: this.entityCount * (MAT4_ITEM_COUNT + VEC3_ITEM_COUNT) * SIZEOF_FLOAT,
            callback: (data) => {
                const instanceData = new Float32Array(data);
                let offset = 0;
                for (const entities of this.scene.values()) {
                    this.addInstanceData(instanceData, entities, offset);
                    offset += entities.length;
                }
            },
            usage: BufferUsage.VERTEX,
        });
    }

    private addInstanceData(instanceData: Float32Array, entities: Entity[], offset: number): void {
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const instanceDataStartPosition = (i + offset) * (MAT4_ITEM_COUNT + VEC3_ITEM_COUNT);
            mat4.fromRotationTranslationScale(Cell.M, Cell.defaultRotation, entity.position, entity.scale);
            instanceData.set(Cell.M, instanceDataStartPosition);
            instanceData.set(entity.color, instanceDataStartPosition + MAT4_ITEM_COUNT);
        }
    }

    public render(commandBuffer: CommandBuffer, vertexBuffers: Buffer[], indexBuffers: Buffer[]): void {
        if (options.isFrustumCulling() && !this.isInFrustum()) {
            return;
        }
        statistics.increment('rendered-cells', 1);
        const vertexBufferIndex = 0;
        const instanceBufferIndex = 1;
        let offset = 0;
        const instanceOffsetSupported = rendering.getCapabilities().instanceOffset;
        if (instanceOffsetSupported) {
            commandBuffer.addSetVertexBufferCommand({
                vertexBuffer: this.instanceBuffer,
                index: instanceBufferIndex,
            });
        }
        for (const [mesh, entities] of this.scene) {
            if (!entities.length) {
                continue;
            }
            commandBuffer.addSetVertexBufferCommand({ vertexBuffer: vertexBuffers[mesh.vertexBufferIndex], index: vertexBufferIndex });
            if (!instanceOffsetSupported) {
                commandBuffer.addSetVertexBufferCommand({
                    vertexBuffer: this.instanceBuffer,
                    index: instanceBufferIndex,
                    offset: offset * (MAT4_ITEM_COUNT + VEC3_ITEM_COUNT) * SIZEOF_FLOAT,
                });
            }
            commandBuffer.addSetIndexBufferCommand(indexBuffers[mesh.indexBufferIndex]);
            const instanceOffset = instanceOffsetSupported ? offset : 0;
            commandBuffer.addDrawInstancedIndexedCommand({ indexCount: mesh.indexCount, instanceCount: entities.length, instanceOffset });
            statistics.increment('rendered-vertices', mesh.vertexCount * entities.length);
            statistics.increment('rendered-triangles', (mesh.indexCount / 3) * entities.length);
            offset += entities.length;
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

    public reset(): void {
        this.instanceBuffer.release();
        this.instanceBuffer = this.createInstanceBuffer();
        Cell.updateMaxCellDistance();
    }

    public release(): void {
        this.instanceBuffer.release();
        statistics.increment('instances', -this.instanceCount);
        statistics.increment('vertices', -this.vertexCount);
        statistics.increment('triangles', -this.triangleCount);
        for (const entities of this.scene.values()) {
            addToVec3Pool(entities[0].color);
            for (const entity of entities) {
                addToVec3Pool(entity.position);
                addToVec3Pool(entity.scale);
            }
        }
        this.scene.clear();
        this.valid = false;
    }
}
