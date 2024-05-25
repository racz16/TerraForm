import { rendering, statistics } from '../..';
import { ApiError } from '../rendering-context';
import { EXTDisjointTimerQueryWebGL2, GL2_GPU_TIME_EXTENSION } from '../webgl/gl-extensions';
import { GlRenderingContext } from '../webgl/gl-rendering-context';

export function getGl2ContextWrapper(): Gl2RenderingContext {
    return rendering.getContext() as Gl2RenderingContext;
}

export function getGl2Context(): WebGL2RenderingContext {
    return getGl2ContextWrapper().getId();
}

export class Gl2RenderingContext extends GlRenderingContext {
    protected context!: WebGL2RenderingContext;
    private gl2GpuTimeExtension: EXTDisjointTimerQueryWebGL2 | null = null;

    public initialize(): void {
        this.initializeShared('WebGL 2');
    }

    public getGpuTimeExtension(): EXTDisjointTimerQueryWebGL2 | null {
        return this.gl2GpuTimeExtension;
    }

    public getId(): WebGL2RenderingContext {
        return this.context;
    }

    protected override capabilitiesAndExtensions(): void {
        this.gl2GpuTimeExtension = this.context.getExtension(GL2_GPU_TIME_EXTENSION);
        statistics.increment('api-calls', 1);
        let precision: GLint = 0;
        if (this.gl2GpuTimeExtension) {
            precision = this.context.getQuery(
                this.gl2GpuTimeExtension.TIME_ELAPSED_EXT,
                this.gl2GpuTimeExtension.QUERY_COUNTER_BITS_EXT
            ) as GLint;
            statistics.increment('api-calls', 1);
        }
        this.capabilities.uniformBuffer = true;
        this.capabilities.gpuTimer = !!(this.gl2GpuTimeExtension && precision);
        this.capabilities.instancedRendering = true;
        this.capabilities.depthTexture = true;
        this.capabilities.vertexArray = true;
    }

    protected override createContext(): WebGLRenderingContext | WebGL2RenderingContext {
        const context = this.getContext('webgl2');
        if (!context) {
            if (DEVELOPMENT) {
                console.log("Couldn't create a WebGL 2 context");
            }
            throw new ApiError();
        }
        if (DEVELOPMENT) {
            console.log('Context created');
        }
        return context;
    }

    protected override vertexAttribDivisor(index: number, divisor: number): void {
        this.context.vertexAttribDivisor(index, divisor);
    }
}
