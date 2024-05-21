import { rendering, statistics } from '../..';
import { Command } from '../command';
import { getGl1Context } from '../rendering-context';
import { DrawInstancedIndexedCommandDescriptor, SetDrawConfigCommandDescriptor, SetVertexBufferCommandDescriptor } from '../renderpass';

export class Gl1SetVertexBufferCommand implements Command {
    private descriptor: SetVertexBufferCommandDescriptor;

    public constructor(descriptor: SetVertexBufferCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        getGl1Context().configVbo(this.descriptor);
    }
}

export class Gl1SetDrawConfigCommand implements Command {
    private descriptor: SetDrawConfigCommandDescriptor;

    public constructor(descriptor: SetDrawConfigCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        if (rendering.getCapabilities().vertexArray) {
            const mesh = this.descriptor.drawConfig;
            getGl1Context().getVertexArrayObjectExtension()?.bindVertexArrayOES(mesh.getId());
            statistics.increment('api-calls', 1);
        } else {
            const mesh = this.descriptor.drawConfig.getMesh();
            getGl1Context().configDraw(
                mesh.vertexBufferDescriptor,
                mesh.indexBufferDescriptor.buffer,
                this.descriptor.drawConfig.getInstanceData()
            );
        }
    }
}

export class Gl1DrawInstancedIndexedCommand implements Command {
    private descriptor: DrawInstancedIndexedCommandDescriptor;

    public constructor(descriptor: DrawInstancedIndexedCommandDescriptor) {
        this.descriptor = descriptor;
        if (DEVELOPMENT) {
            if (descriptor.instanceOffset) {
                throw new Error('Instance offset is not supported in WebGL');
            }
        }
    }

    public execute(): void {
        const context = getGl1Context().getId();
        getGl1Context()
            .getInstancedRenderingExtension()!
            .drawElementsInstancedANGLE(
                context.TRIANGLES,
                this.descriptor.indexCount,
                context.UNSIGNED_SHORT,
                0,
                this.descriptor.instanceCount
            );
        if (rendering.getCapabilities().vertexArray) {
            getGl1Context().getVertexArrayObjectExtension()!.bindVertexArrayOES(null);
            statistics.increment('api-calls', 1);
        }
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', this.descriptor.instanceCount);
    }
}
