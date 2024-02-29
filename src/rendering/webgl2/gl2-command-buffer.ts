import { Gl2DrawInstancedIndexedCommand, Gl2SetUniformBufferCommand, Gl2SetVertexBufferCommand } from './gl2-command';
import { GlCommandBuffer } from '../webgl/gl-command-buffer';
import {
    DrawInstancedIndexedCommandDescriptor,
    SetUniformBufferCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../command-buffer';

export class Gl2CommandBuffer extends GlCommandBuffer {
    public override addSetVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void {
        this.commands.push(new Gl2SetVertexBufferCommand(descriptor, this.pipeline!));
    }

    public override addSetUniformBufferCommand(descriptor: SetUniformBufferCommandDescriptor): void {
        this.commands.push(new Gl2SetUniformBufferCommand(descriptor, this.pipeline!.getDescriptor().shader));
    }

    public override addDrawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void {
        this.commands.push(new Gl2DrawInstancedIndexedCommand(descriptor));
    }
}
