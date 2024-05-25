import { statistics } from '../..';
import { DrawConfig, DrawConfigDescriptor } from '../draw-config';
import { Mesh, VertexBufferDescriptor } from '../mesh';
import { getRenderingCapabilities } from '../rendering-context';
import { getGl1ContextWrapper } from './gl1-rendering-context';

export class Gl1DrawConfig implements DrawConfig {
    protected contextWrapper = getGl1ContextWrapper();
    private extension: OES_vertex_array_object | null;
    private descriptor: DrawConfigDescriptor;
    private vao: WebGLVertexArrayObjectOES | null = null;
    private valid = true;

    public constructor(descriptor: DrawConfigDescriptor) {
        this.descriptor = descriptor;
        this.extension = this.contextWrapper.getVertexArrayObjectExtension();
        if (getRenderingCapabilities().vertexArray && this.extension) {
            this.vao = this.extension.createVertexArrayOES();
            this.extension.bindVertexArrayOES(this.vao);
            const mesh = descriptor.mesh;
            this.contextWrapper.configDraw(mesh.vertexBufferDescriptor, mesh.indexBufferDescriptor.buffer, descriptor.instanceData);
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
