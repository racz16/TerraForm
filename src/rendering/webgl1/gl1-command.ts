import { statistics } from '../..';
import { Command } from '../command';
import { getRenderingCapabilities } from '../rendering-context';
import { DrawInstancedIndexedCommandDescriptor, SetDrawConfigCommandDescriptor, SetVertexBufferCommandDescriptor } from '../renderpass';
import { getGlContext } from '../webgl/gl-rendering-context';
import { getGl1ContextWrapper } from './gl1-rendering-context';

export class Gl1SetVertexBufferCommand implements Command {
    private descriptor: SetVertexBufferCommandDescriptor;

    public constructor(descriptor: SetVertexBufferCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        getGl1ContextWrapper().configVbo(this.descriptor);
    }
}

export class Gl1SetDrawConfigCommand implements Command {
    protected contextWrapper = getGl1ContextWrapper();
    private descriptor: SetDrawConfigCommandDescriptor;

    public constructor(descriptor: SetDrawConfigCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        if (getRenderingCapabilities().vertexArray) {
            const drawConfig = this.descriptor.drawConfig;
            this.contextWrapper.getVertexArrayObjectExtension()?.bindVertexArrayOES(drawConfig.getId());
            statistics.increment('api-calls', 1);
        } else {
            const mesh = this.descriptor.drawConfig.getMesh();
            this.contextWrapper.configDraw(
                mesh.vertexBufferDescriptor,
                mesh.indexBufferDescriptor.buffer,
                this.descriptor.drawConfig.getInstanceData()
            );
        }
    }
}

export class Gl1DrawInstancedIndexedCommand implements Command {
    protected context = getGlContext();
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
        getGl1ContextWrapper()
            .getInstancedRenderingExtension()!
            .drawElementsInstancedANGLE(
                this.context.TRIANGLES,
                this.descriptor.indexCount,
                this.context.UNSIGNED_SHORT,
                0,
                this.descriptor.instanceCount
            );
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', this.descriptor.instanceCount);
    }
}
