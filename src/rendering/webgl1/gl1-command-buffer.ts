import { DrawInstancedIndexedCommandDescriptor, SetVertexBufferCommandDescriptor } from '../command-buffer';
import { GlCommandBuffer } from '../webgl/gl-command-buffer';
import { Gl1DrawInstancedIndexedCommand, Gl1SetVertexBufferCommand } from './gl1-command';

export class Gl1CommandBuffer extends GlCommandBuffer {
    public override addSetVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void {
        this.commands.push(new Gl1SetVertexBufferCommand(descriptor, this.pipeline!));
    }

    public override addSetUniformBufferCommand(): void {
        throw new Error('Uniform buffers are not supported in WebGL 1');
    }

    public override addDrawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void {
        this.commands.push(new Gl1DrawInstancedIndexedCommand(descriptor));
    }
}
