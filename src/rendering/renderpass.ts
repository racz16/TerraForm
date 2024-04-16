import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

import { Pipeline } from './pipeline';
import { Buffer } from './buffer';
import { Texture } from './texture';
import { TimeQuery } from './time-query';

export interface SetVertexBufferCommandDescriptor {
    vertexBuffer: Buffer;
    index: number;
    offset?: number;
}

export interface SetUniformCommandDescriptor<T> {
    name: string;
    value: T;
}

export interface SetIndexedUniformCommandDescriptor<T> extends SetUniformCommandDescriptor<T> {
    index: number;
}

export interface DrawInstancedIndexedCommandDescriptor {
    indexCount: number;
    instanceCount: number;
    instanceOffset?: number;
}

export interface ColorAttachment {
    texture: Texture;
    clearColor?: number[];
}

export interface DepthAttachment {
    texture: Texture;
    clearValue?: number;
}

export interface OffscreenRenderpassDescriptor {
    type: 'offscreen';
    colorAttachments: ColorAttachment[];
    depthStencilAttachment?: DepthAttachment;
    query?: TimeQuery;
    label?: string;
}

export interface CanvasRenderpassDescriptor {
    type: 'canvas';
    clearColor?: number[];
    depthStencilAttachment?: DepthAttachment;
    query?: TimeQuery;
    label?: string;
}

export type RenderpassDescriptor = OffscreenRenderpassDescriptor | CanvasRenderpassDescriptor;

export interface Renderpass {
    setPipelineCommand(pipeline: Pipeline): void;
    setVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void;
    setIndexBufferCommand(indexBuffer: Buffer): void;
    setUniformBufferCommand(descriptor: SetIndexedUniformCommandDescriptor<Buffer>): void;
    setUniformFloatCommand(descriptor: SetUniformCommandDescriptor<number>): void;
    setUniformVec2Command(descriptor: SetUniformCommandDescriptor<vec2>): void;
    setUniformVec3Command(descriptor: SetUniformCommandDescriptor<vec3>): void;
    setUniformVec4Command(descriptor: SetUniformCommandDescriptor<vec4>): void;
    setUniformMat2Command(descriptor: SetUniformCommandDescriptor<mat2>): void;
    setUniformMat3Command(descriptor: SetUniformCommandDescriptor<mat3>): void;
    setUniformMat4Command(descriptor: SetUniformCommandDescriptor<mat4>): void;
    setUniformTextureCommand(descriptor: SetIndexedUniformCommandDescriptor<Texture>): void;
    drawIndexedCommand(indexCount: number): void;
    drawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void;
    pushDebugGroupCommand(label: string): void;
    popDebugGroupCommand(): void;
    addDebugLabelCommand(label: string): void;
}
