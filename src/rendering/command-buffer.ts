import { isWebGL1, isWebGL2 } from './rendering';
import { GpuCommandBuffer } from './webgpu/gpu-command-buffer';
import { Renderpass, RenderpassDescriptor } from './renderpass';
import { GlCommandBuffer } from './webgl/gl-command-buffer';

export interface CommandBuffer {
    createRenderpass(descriptor: RenderpassDescriptor): Renderpass;
    execute(): void;
}

export function createCommandBuffer(label?: string): CommandBuffer {
    if (isWebGL1() || isWebGL2()) {
        return new GlCommandBuffer();
    } else {
        return new GpuCommandBuffer(label);
    }
}
