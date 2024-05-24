import { rendering } from '..';
import { isWebGL1, isWebGL2 } from './rendering';
import { Gl1RenderingContext } from './webgl1/gl1-rendering-context';
import { Gl2RenderingContext } from './webgl2/gl2-rendering-context';
import { GpuRenderingContext } from './webgpu/gpu-rendering-context';

export interface RenderingContext {
    getId(): any;
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

export function getGl1Context(): Gl1RenderingContext {
    return rendering.getContext() as Gl1RenderingContext;
}

export function getGl2Context(): Gl2RenderingContext {
    return rendering.getContext() as Gl2RenderingContext;
}

export function getGpuContext(): GpuRenderingContext {
    return rendering.getContext() as GpuRenderingContext;
}
