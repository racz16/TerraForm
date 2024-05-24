import { CommandBuffer } from '../command-buffer';
import { isWebGL1 } from '../rendering';
import { Renderpass, RenderpassDescriptor } from '../renderpass';
import { Gl1Renderpass } from '../webgl1/gl1-renderpass';
import { Gl2Renderpass } from '../webgl2/gl2-renderpass';
import { GlRenderpass } from './gl-renderpass';

export class GlCommandBuffer implements CommandBuffer {
    private renderpasses: GlRenderpass[] = [];

    public createRenderpass(descriptor: RenderpassDescriptor): Renderpass {
        const renderpass = this.createGlRenderpass(descriptor);
        this.renderpasses.push(renderpass);
        return renderpass;
    }

    private createGlRenderpass(descriptor: RenderpassDescriptor): GlRenderpass {
        if (isWebGL1()) {
            return new Gl1Renderpass(descriptor);
        } else {
            return new Gl2Renderpass(descriptor);
        }
    }

    public execute(): void {
        for (const renderpass of this.renderpasses) {
            renderpass.execute();
        }
    }
}
