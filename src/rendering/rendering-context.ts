import { rendering } from '..';
import { isWebGL1, isWebGL2 } from './rendering';
import { RenderingCapabilities } from './rendering-capabilities';
import { Gl1RenderingContext } from './webgl1/gl1-rendering-context';
import { Gl2RenderingContext } from './webgl2/gl2-rendering-context';
import { GpuRenderingContext } from './webgpu/gpu-rendering-context';

export interface RenderingContext {
    getId(): any;
    getCapabilities(): RenderingCapabilities;
    stop(): Promise<void>;
    release(): void;
}

export class ApiError extends Error {}

export async function createRenderingContext(): Promise<RenderingContext> {
    if (isWebGL1()) {
        const context = new Gl1RenderingContext();
        context.initialize();
        return context;
    } else if (isWebGL2()) {
        const context = new Gl2RenderingContext();
        context.initialize();
        return context;
    } else {
        const context = new GpuRenderingContext();
        await context.initialize();
        return context;
    }
}

export function getRenderingCapabilities(): RenderingCapabilities {
    return rendering.getContext().getCapabilities();
}
