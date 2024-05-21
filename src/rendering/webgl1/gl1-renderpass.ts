import { DrawInstancedIndexedCommandDescriptor, SetDrawConfigCommandDescriptor, SetVertexBufferCommandDescriptor } from '../renderpass';
import { GlRenderpass } from '../webgl/gl-renderpass';
import { Gl1DrawInstancedIndexedCommand, Gl1SetDrawConfigCommand, Gl1SetVertexBufferCommand } from './gl1-command';

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
}
