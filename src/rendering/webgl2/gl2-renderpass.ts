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
import { getGl2Context } from '../rendering-context';
import { statistics } from '../..';

export class Gl2Renderpass extends GlRenderpass {
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

    protected override unbundVao(): void {
        getGl2Context().getId().bindVertexArray(null);
        statistics.increment('api-calls', 1);
    }
}
