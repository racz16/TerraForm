import { Gl2Buffer } from './webgl2/gl2-buffer';
import { GpuBuffer } from './webgpu/gpu-buffer';
import { isWebGL1, isWebGL2 } from './rendering';
import { Gl1Buffer } from './webgl1/gl1-buffer';
import { MathType } from '../utility';

export interface Buffer {
    getSize(): number;
    getUsage(): BufferUsage;
    setData(data: BufferDataDescriptor): void;
    release(): void;
}

interface BufferFromSizeDescriptor {
    type: 'size';
    size: number;
    usage: BufferUsage;
    label?: string;
    dynamic?: boolean;
}

interface BufferFromDataDescriptor {
    type: 'data';
    data: ArrayBufferView;
    dataOffset?: number;
    dataLength?: number;
    usage: BufferUsage;
    label?: string;
    dynamic?: boolean;
}

export type BufferDescriptor = BufferFromSizeDescriptor | BufferFromDataDescriptor;

interface BufferDataFromBufferSourceDescriptor {
    type: 'buffer';
    data: ArrayBufferView;
    dataOffset?: number;
    dataLength?: number;
    offset?: number;
}

interface BufferDataFromMathTypeDescriptor {
    type: 'math';
    data: MathType;
    offset?: number;
}

export enum BufferUsage {
    VERTEX = 1,
    INDEX = 2,
    UNIFORM = 4,
}

export type BufferDataDescriptor = BufferDataFromBufferSourceDescriptor | BufferDataFromMathTypeDescriptor;

export function createBuffer(descriptor: BufferDescriptor): Buffer {
    if (isWebGL1()) {
        return new Gl1Buffer(descriptor);
    } else if (isWebGL2()) {
        return new Gl2Buffer(descriptor);
    } else {
        return new GpuBuffer(descriptor);
    }
}
