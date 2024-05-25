import {
    Gl2DrawInstancedIndexedCommand,
    Gl2SetDrawConfigCommand,
    Gl2SetUniformBufferCommand,
    Gl2SetVertexBufferCommand,
} from './gl2-command';

import { GlRenderpass } from '../webgl/gl-renderpass';
import {
    DrawInstancedIndexedCommandDescriptor,
    SetIndexedUniformCommandDescriptor,
    SetDrawConfigCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../renderpass';
import { Buffer } from '../buffer';
import { statistics } from '../..';

export class Gl2Renderpass extends GlRenderpass {
    protected context!: WebGL2RenderingContext;

    public override setVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void {
        this.commands.push(new Gl2SetVertexBufferCommand(descriptor));
    }

    public override setDrawConfigCommand(descriptor: SetDrawConfigCommandDescriptor): void {
        this.commands.push(new Gl2SetDrawConfigCommand(descriptor));
    }

    public override setUniformBufferCommand(descriptor: SetIndexedUniformCommandDescriptor<Buffer>): void {
        this.commands.push(new Gl2SetUniformBufferCommand(descriptor, this.pipeline!.getShader()));
    }

    public override drawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void {
        this.commands.push(new Gl2DrawInstancedIndexedCommand(descriptor));
    }

    protected override fboStatusToString(status: GLenum): string {
        switch (status) {
            case this.context.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
            case this.context.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
            case this.context.FRAMEBUFFER_UNSUPPORTED:
                return 'FRAMEBUFFER_UNSUPPORTED';
            case this.context.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
                return 'FRAMEBUFFER_INCOMPLETE_MULTISAMPLE';
            default:
                return 'UNKNOWN FRAMEBUFFER STATUS';
        }
    }

    protected clearColor(index: number, color: number[]): void {
        this.context.clearBufferfv(this.context.COLOR, index, color);
        statistics.increment('api-calls', 1);
    }

    protected override unbundVao(): void {
        this.context.bindVertexArray(null);
        statistics.increment('api-calls', 1);
    }
}
