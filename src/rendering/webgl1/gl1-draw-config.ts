import { rendering, statistics } from '../..';
import { DrawConfig, DrawConfigDescriptor } from '../draw-config';
import { Mesh, VertexBufferDescriptor } from '../mesh';
import { getGl1Context } from '../rendering-context';

export class Gl1DrawConfig implements DrawConfig {
    private extension: OES_vertex_array_object | null;
    private descriptor: DrawConfigDescriptor;
    private vao: WebGLVertexArrayObjectOES | null = null;
    private valid = true;

    public constructor(descriptor: DrawConfigDescriptor) {
        this.descriptor = descriptor;
        const context = getGl1Context();
        this.extension = context.getVertexArrayObjectExtension();
        if (rendering.getCapabilities().vertexArray && this.extension) {
            this.vao = this.extension.createVertexArrayOES();
            this.extension.bindVertexArrayOES(this.vao);
            const mesh = descriptor.mesh;
            getGl1Context().configDraw(mesh.vertexBufferDescriptor, mesh.indexBufferDescriptor.buffer, descriptor.instanceData);
            this.extension.bindVertexArrayOES(null);
            statistics.increment('api-calls', 3);
        }
    }

    public getId(): WebGLVertexArrayObjectOES | null {
        return this.vao;
    }

    public getMesh(): Mesh {
        return this.descriptor.mesh;
    }

    public getInstanceData(): VertexBufferDescriptor | undefined {
        return this.descriptor.instanceData;
    }

    public release(): void {
        if (this.valid && this.vao) {
            this.extension?.deleteVertexArrayOES(this.vao);
            statistics.increment('api-calls', 1);
            this.valid = false;
        }
    }
}
