import { Pipeline, PipelineDescriptor } from '../pipeline';
import { Shader } from '../shader';

export class GlPipeline implements Pipeline {
    private descriptor: PipelineDescriptor;

    public constructor(descriptor: PipelineDescriptor) {
        this.descriptor = descriptor;
    }

    public getId(): null {
        return null;
    }

    public getShader(): Shader {
        return this.descriptor.shader;
    }
}
