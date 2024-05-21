import { statistics } from '../..';
import { DrawConfig, DrawConfigDescriptor } from '../draw-config';
import { Mesh, VertexBufferDescriptor } from '../mesh';
import { getGl2Context } from '../rendering-context';

export class Gl2DrawConfig implements DrawConfig {
    private context: WebGL2RenderingContext;
    private descriptor: DrawConfigDescriptor;
    private vao: WebGLVertexArrayObject | null;
    private valid = true;

    public constructor(descriptor: DrawConfigDescriptor) {
        this.descriptor = descriptor;
        this.context = getGl2Context().getId();
        this.vao = this.context.createVertexArray();
        this.context.bindVertexArray(this.vao);
        const mesh = descriptor.mesh;
        getGl2Context().configDraw(mesh.vertexBufferDescriptor, mesh.indexBufferDescriptor.buffer, descriptor.instanceData);
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
