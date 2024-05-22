import { rendering, statistics } from '../..';
import { EXTDisjointTimerQueryWebGL2, GL2_GPU_TIME_EXTENSION } from '../webgl/gl-extensions';
import { GlRenderingContext } from '../webgl/gl-rendering-context';

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
            console.log(precision);
            statistics.increment('api-calls', 1);
        }
        rendering.getCapabilities().uniformBuffer = true;
        rendering.getCapabilities().gpuTimer = !!(this.gl2GpuTimeExtension && precision);
        rendering.getCapabilities().instancedRendering = true;
        rendering.getCapabilities().debugGroups = false;
        rendering.getCapabilities().depthTexture = true;
        rendering.getCapabilities().uvUp = true;
        rendering.getCapabilities().vertexArray = true;
    }

    protected override createContext(): WebGLRenderingContextBase {
        const context = this.getContext('webgl2');
        if (!context) {
            throw new Error("Couldn't create a WebGL 2 context");
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
