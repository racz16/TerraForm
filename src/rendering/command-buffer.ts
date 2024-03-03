import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

import { Pipeline } from './pipeline';
import { Buffer } from './buffer';
import { isWebGL1, isWebGL2 } from './rendering';
import { Gl2CommandBuffer } from './webgl2/gl2-command-buffer';
import { GpuCommandBuffer } from './webgpu/gpu-command-buffer';
import { Gl1CommandBuffer } from './webgl1/gl1-command-buffer';
import { TimeQuery } from './time-query';

export interface SetVertexBufferCommandDescriptor {
    vertexBuffer: Buffer;
    index: number;
    offset?: number;
}

export interface SetUniformBufferCommandDescriptor {
    index: number;
    name: string;
    uniformBuffer: Buffer;
}

export interface SetUniformCommandDescriptor<T> {
    name: string;
    value: T;
}

export interface DrawInstancedIndexedCommandDescriptor {
    indexCount: number;
    instanceCount: number;
    instanceOffset?: number;
}

export interface CommandBuffer {
    addSetPipelineCommand(pipeline: Pipeline): void;
    addSetVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void;
    addSetIndexBufferCommand(indexBuffer: Buffer): void;
    addSetUniformBufferCommand(descriptor: SetUniformBufferCommandDescriptor): void;
    addSetUniformFloatCommand(descriptor: SetUniformCommandDescriptor<number>): void;
    addSetUniformVec2Command(descriptor: SetUniformCommandDescriptor<vec2>): void;
    addSetUniformVec3Command(descriptor: SetUniformCommandDescriptor<vec3>): void;
    addSetUniformVec4Command(descriptor: SetUniformCommandDescriptor<vec4>): void;
    addSetUniformMat2Command(descriptor: SetUniformCommandDescriptor<mat2>): void;
    addSetUniformMat3Command(descriptor: SetUniformCommandDescriptor<mat3>): void;
    addSetUniformMat4Command(descriptor: SetUniformCommandDescriptor<mat4>): void;
    addDrawIndexedCommand(indexCount: number): void;
    addDrawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void;
    addPushDebugGroup(label: string): void;
    addPopDebugGroup(): void;
    addDebugLabel(label: string): void;
    execute(): void;
}

export interface CommandBufferDescriptor {
    label?: string;
    query?: TimeQuery;
}

export function createCommandBuffer(descriptor: CommandBufferDescriptor): CommandBuffer {
    if (isWebGL1()) {
        return new Gl1CommandBuffer(descriptor);
    } else if (isWebGL2()) {
        return new Gl2CommandBuffer(descriptor);
    } else {
        return new GpuCommandBuffer(descriptor);
    }
}
