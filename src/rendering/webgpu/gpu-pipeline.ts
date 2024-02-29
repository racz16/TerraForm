import { statistics } from '../..';
import { Pipeline, PipelineDescriptor, VertexAttributeFormat } from '../pipeline';
import { getGpuContext } from '../rendering-context';

export class GpuPipeline implements Pipeline {
    private pipeline: GPURenderPipeline;
    private descriptor: PipelineDescriptor;

    public constructor(descriptor: PipelineDescriptor) {
        this.descriptor = descriptor;
        this.pipeline = getGpuContext()
            .getDevice()
            .createRenderPipeline({
                vertex: {
                    module: descriptor.shader.getId(),
                    buffers: descriptor.vertexBuffers.map<GPUVertexBufferLayout>((vbl) => ({
                        arrayStride: vbl.stride,
                        stepMode: vbl.isInstanced ? 'instance' : 'vertex',
                        attributes: vbl.attributes.map((a) => ({
                            shaderLocation: a.index,
                            offset: a.offset,
                            format: this.getFormat(a.format),
                        })),
                    })),
                },
                fragment: {
                    module: descriptor.shader.getId(),
                    targets: [{ format: getGpuContext().getCanvasFormat() }],
                },
                depthStencil: {
                    format: 'depth32float',
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                },
                primitive: {
                    cullMode: 'back',
                },
                layout: 'auto',
            });
        statistics.increment('api-calls', 1);
    }

    public getId(): GPURenderPipeline {
        return this.pipeline;
    }

    public getDescriptor(): PipelineDescriptor {
        return this.descriptor;
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
