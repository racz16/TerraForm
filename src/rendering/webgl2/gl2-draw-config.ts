import { statistics } from '../..';
import { DrawConfig, DrawConfigDescriptor } from '../draw-config';
import { Mesh, VertexBufferDescriptor } from '../mesh';
import { getGl2Context, getGl2ContextWrapper } from './gl2-rendering-context';

export class Gl2DrawConfig implements DrawConfig {
    protected context = getGl2Context();
    private descriptor: DrawConfigDescriptor;
    private vao: WebGLVertexArrayObject | null;
    private valid = true;

    public constructor(descriptor: DrawConfigDescriptor) {
        this.descriptor = descriptor;
        this.vao = this.context.createVertexArray();
        this.context.bindVertexArray(this.vao);
        const mesh = descriptor.mesh;
        getGl2ContextWrapper().configDraw(mesh.vertexBufferDescriptor, mesh.indexBufferDescriptor.buffer, descriptor.instanceData);
        this.context.bindVertexArray(null);
        statistics.increment('api-calls', 3);
    }

    public getId(): WebGLVertexArrayObject | null {
        return this.vao;
    }

    public getMesh(): Mesh {
        return this.descriptor.mesh;
    }

    public getInstanceData(): VertexBufferDescriptor | undefined {
        return this.descriptor.instanceData;
    }

    public release(): void {
        if (this.valid) {
            this.context.deleteVertexArray(this.vao);
            statistics.increment('api-calls', 1);
            this.valid = false;
        }
    }
}
