import { statistics } from '../..';
import { getRenderingCapabilities } from '../rendering-context';
import { DrawInstancedIndexedCommandDescriptor, SetDrawConfigCommandDescriptor, SetVertexBufferCommandDescriptor } from '../renderpass';
import { GlRenderpass } from '../webgl/gl-renderpass';
import { Gl1DrawInstancedIndexedCommand, Gl1SetDrawConfigCommand, Gl1SetVertexBufferCommand } from './gl1-command';
import { getGl1ContextWrapper } from './gl1-rendering-context';

export class Gl1Renderpass extends GlRenderpass {
    public override setVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void {
        this.commands.push(new Gl1SetVertexBufferCommand(descriptor));
    }

    public override setDrawConfigCommand(descriptor: SetDrawConfigCommandDescriptor): void {
        this.commands.push(new Gl1SetDrawConfigCommand(descriptor));
    }

    public override setUniformBufferCommand(): void {
        throw new Error('Uniform buffers are not supported in WebGL 1');
    }

    public override drawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void {
        this.commands.push(new Gl1DrawInstancedIndexedCommand(descriptor));
    }

    protected override fboStatusToString(status: GLenum): string {
        switch (status) {
            case this.context.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
            case this.context.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
            case this.context.FRAMEBUFFER_UNSUPPORTED:
                return 'FRAMEBUFFER_UNSUPPORTED';
            default:
                return 'UNKNOWN FRAMEBUFFER STATUS';
        }
    }

    protected clearColor(index: number, color: number[]): void {
        this.context.clearColor(color[0], color[1], color[2], color[3]);
        this.context.clear(this.context.COLOR_BUFFER_BIT);
        statistics.increment('api-calls', 2);
    }

    protected override unbundVao(): void {
        if (getRenderingCapabilities().vertexArray) {
            getGl1ContextWrapper().getVertexArrayObjectExtension()!.bindVertexArrayOES(null);
            statistics.increment('api-calls', 1);
        }
    }
}
