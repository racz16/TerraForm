import { Pipeline, PipelineDescriptor } from '../pipeline';

export class GlPipeline implements Pipeline {
    private descriptor: PipelineDescriptor;

    public constructor(descriptor: PipelineDescriptor) {
        this.descriptor = descriptor;
    }

    public getId(): null {
        return null
    }

    public getDescriptor(): PipelineDescriptor {
        return this.descriptor;
    }
}
