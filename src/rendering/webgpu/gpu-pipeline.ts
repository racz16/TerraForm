import { statistics } from '../..';
import { Pipeline, PipelineDescriptor, VertexAttributeFormat } from '../pipeline';
import { getGpuContext } from '../rendering-context';
import { Shader } from '../shader';

export class GpuPipeline implements Pipeline {
    private pipeline!: GPURenderPipeline;
    private descriptor: PipelineDescriptor;

    public constructor(descriptor: PipelineDescriptor) {
        this.descriptor = descriptor;
    }

    public async initialize(): Promise<void> {
        const pipelineDescriptor: GPURenderPipelineDescriptor = {
            vertex: {
                module: this.descriptor.shader.getId(),
                buffers: this.descriptor.vertexBufferLayouts.map<GPUVertexBufferLayout>((vbl) => ({
                    arrayStride: vbl.stride,
                    stepMode: vbl.instanced ? 'instance' : 'vertex',
                    attributes: vbl.attributes.map((a) => ({
                        shaderLocation: a.index,
                        offset: a.offset,
                        format: this.getFormat(a.format),
                    })),
                })),
            },
            fragment: {
                module: this.descriptor.shader.getId(),
                targets: this.descriptor.attachmentFormats.map((af) => ({
                    format: af === 'canvas' ? getGpuContext().getCanvasFormat() : 'rgba8unorm',
                })),
            },
            primitive: {
                cullMode: 'back',
            },
            layout: 'auto',
            label: this.descriptor.label,
        };
        if (this.descriptor.depthAttachment) {
            pipelineDescriptor.depthStencil = {
                format: 'depth32float',
                depthWriteEnabled: true,
                depthCompare: 'less',
            };
        }
        this.pipeline = await getGpuContext().getDevice().createRenderPipelineAsync(pipelineDescriptor);
        statistics.increment('api-calls', 1);
    }

    public getId(): GPURenderPipeline {
        return this.pipeline;
    }

    public getShader(): Shader {
        return this.descriptor.shader;
    }

    private getFormat(format: VertexAttributeFormat): GPUVertexFormat {
        switch (format) {
            case VertexAttributeFormat.FLOAT_1:
                return 'float32';
            case VertexAttributeFormat.FLOAT_2:
                return 'float32x2';
            case VertexAttributeFormat.FLOAT_3:
                return 'float32x3';
            case VertexAttributeFormat.FLOAT_4:
                return 'float32x4';
        }
    }
}
