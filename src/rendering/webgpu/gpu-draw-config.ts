import { DrawConfig, DrawConfigDescriptor } from '../draw-config';
import { Mesh, VertexBufferDescriptor } from '../mesh';

export class GpuDrawConfig implements DrawConfig {
    private descriptor: DrawConfigDescriptor;

    public constructor(descriptor: DrawConfigDescriptor) {
        this.descriptor = descriptor;
    }

    public getId(): null {
        return null;
    }

    public getMesh(): Mesh {
        return this.descriptor.mesh;
    }

    public getInstanceData(): VertexBufferDescriptor | undefined {
        return this.descriptor.instanceData;
    }

    public release(): void {}
}
