import { isWebGL1, isWebGL2 } from './rendering';
import { Shader } from './shader';
import { GlPipeline } from './webgl/gl-pipeline';
import { GpuPipeline } from './webgpu/gpu-pipeline';

export enum VertexAttributeFormat {
    FLOAT_1 = 1,
    FLOAT_2 = 2,
    FLOAT_3 = 3,
    FLOAT_4 = 4,
}

export interface Pipeline {
    getId(): any;
    getDescriptor(): PipelineDescriptor;
}

export async function createPipeline(descriptor: PipelineDescriptor): Promise<Pipeline> {
    if (isWebGL1()) {
        return new GlPipeline(descriptor);
    } else if (isWebGL2()) {
        return new GlPipeline(descriptor);
    } else {
        const pipeline = new GpuPipeline(descriptor);
        return pipeline.initialize().then(() => pipeline);
    }
}

export interface VertexAttribute {
    index: number;
    offset: number;
    format: VertexAttributeFormat;
}

export interface VertexBufferLayout {
    stride: number;
    isInstanced: boolean;
    attributes: VertexAttribute[];
}

export interface PipelineDescriptor {
    label?: string;
    shader: Shader;
    vertexBuffers: VertexBufferLayout[];
}
