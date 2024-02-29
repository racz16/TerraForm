import { rendering, statistics } from '../..';
import { EXTDisjointTimerQuery, GL1_GPU_TIME_EXTENSION, GL1_INSTANCED_RENDERING_EXTENSION } from '../webgl/gl-extensions';
import { GlRenderingContext } from '../webgl/gl-rendering-context';

export class Gl1RenderingContext extends GlRenderingContext {
    protected context!: WebGLRenderingContext;
    private gl1GpuTimeExtension: EXTDisjointTimerQuery | null = null;
    private gl1InstancedRenderingExtension: ANGLE_instanced_arrays | null = null;

    public initialize(): void {
        this.initializeShared('WebGL 1');
    }

    public getId(): WebGLRenderingContext {
        return this.context;
    }

    protected override capabilitiesAndExtensions(): void {
        this.gl1GpuTimeExtension = this.context.getExtension(GL1_GPU_TIME_EXTENSION);
        this.gl1InstancedRenderingExtension = this.context.getExtension(GL1_INSTANCED_RENDERING_EXTENSION)!;
        statistics.increment('api-calls', 2);
        let precision: GLint = 0;
        if (this.gl1GpuTimeExtension) {
            precision = this.gl1GpuTimeExtension.getQueryEXT(
                this.gl1GpuTimeExtension.TIME_ELAPSED_EXT,
                this.gl1GpuTimeExtension.QUERY_COUNTER_BITS_EXT
            ) as GLint;
            statistics.increment('api-calls', 1);
        }
        rendering.getCapabilities().uniformBuffer = false;
        rendering.getCapabilities().gpuTimer = !!(this.gl1GpuTimeExtension && precision);
        rendering.getCapabilities().instancedRendering = !!this.gl1InstancedRenderingExtension;
        rendering.getCapabilities().debugGroups = false;
    }

    protected override createContext(): WebGLRenderingContextBase {
        const context = this.getContext('webgl') || this.getContext('webgl-experimental');
        if (!context) {
            throw new Error("Couldn't create a WebGL 1 context");
        }
        if (DEVELOPMENT) {
            console.log('Context created');
        }
        return context;
    }

    public getGpuTimeExtension(): EXTDisjointTimerQuery | null {
        return this.gl1GpuTimeExtension;
    }

    public getInstancedRenderingExtension(): ANGLE_instanced_arrays | null {
        return this.gl1InstancedRenderingExtension;
    }
}
