import { rendering, statistics } from '../..';
import { ApiError } from '../rendering-context';
import {
    EXTDisjointTimerQuery,
    GL1_DEPTH_TEXTURE,
    GL1_GPU_TIME_EXTENSION,
    GL1_INSTANCED_RENDERING_EXTENSION,
    GL1_VERTEX_ARRAY_OBJECT,
} from '../webgl/gl-extensions';
import { GlRenderingContext } from '../webgl/gl-rendering-context';

export function getGl1ContextWrapper(): Gl1RenderingContext {
    return rendering.getContext() as Gl1RenderingContext;
}

export class Gl1RenderingContext extends GlRenderingContext {
    protected context!: WebGLRenderingContext;
    private gl1GpuTimeExtension: EXTDisjointTimerQuery | null = null;
    private gl1InstancedRenderingExtension: ANGLE_instanced_arrays | null = null;
    private gl1DepthTexture: WEBGL_depth_texture | null = null;
    private gl1VertexArrayObject: OES_vertex_array_object | null = null;

    public initialize(): void {
        this.initializeShared('WebGL 1');
    }

    public getId(): WebGLRenderingContext {
        return this.context;
    }

    protected override capabilitiesAndExtensions(): void {
        this.gl1GpuTimeExtension = this.context.getExtension(GL1_GPU_TIME_EXTENSION);
        this.gl1InstancedRenderingExtension = this.context.getExtension(GL1_INSTANCED_RENDERING_EXTENSION)!;
        this.gl1DepthTexture = this.context.getExtension(GL1_DEPTH_TEXTURE);
        this.gl1VertexArrayObject = this.context.getExtension(GL1_VERTEX_ARRAY_OBJECT);
        statistics.increment('api-calls', 3);
        let precision: GLint = 0;
        if (this.gl1GpuTimeExtension) {
            precision = this.gl1GpuTimeExtension.getQueryEXT(
                this.gl1GpuTimeExtension.TIME_ELAPSED_EXT,
                this.gl1GpuTimeExtension.QUERY_COUNTER_BITS_EXT
            ) as GLint;
            statistics.increment('api-calls', 1);
        }
        this.capabilities.uniformBuffer = false;
        this.capabilities.gpuTimer = !!(this.gl1GpuTimeExtension && precision);
        this.capabilities.instancedRendering = !!this.gl1InstancedRenderingExtension;
        this.capabilities.depthTexture = !!this.gl1DepthTexture;
        this.capabilities.vertexArray = !!this.gl1VertexArrayObject;
    }

    protected override createContext(): WebGLRenderingContext {
        const context = this.getContext('webgl') || this.getContext('webgl-experimental');
        if (!context) {
            if (DEVELOPMENT) {
                console.log("Couldn't create a WebGL 1 context");
            }
            throw new ApiError();
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

    public getDepthTextureExtension(): WEBGL_depth_texture | null {
        return this.gl1DepthTexture;
    }

    public getVertexArrayObjectExtension(): OES_vertex_array_object | null {
        return this.gl1VertexArrayObject;
    }

    protected override vertexAttribDivisor(index: number, divisor: number): void {
        this.getInstancedRenderingExtension()!.vertexAttribDivisorANGLE(index, divisor);
    }
}
