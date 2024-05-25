import { main, rendering, statistics } from '../..';
import { Buffer } from '../buffer';
import { VertexBufferDescriptor } from '../mesh';
import { VertexAttributeFormat } from '../pipeline';
import { RenderingCapabilities } from '../rendering-capabilities';
import { RenderingContext } from '../rendering-context';
import { GL_DEBUG_RENDERER_INFO } from './gl-extensions';

export function getGlContextWrapper(): GlRenderingContext {
    return rendering.getContext() as GlRenderingContext;
}

export function getGlContext(): WebGLRenderingContext | WebGL2RenderingContext {
    return getGlContextWrapper().getId();
}

export abstract class GlRenderingContext implements RenderingContext {
    protected context!: WebGLRenderingContext | WebGL2RenderingContext;
    protected capabilities: RenderingCapabilities = {
        ndcCube: true,
        debugGroups: false,
        instanceOffset: false,
        uvUp: true,
        depthTexture: false,
        gpuTimer: false,
        instancedRendering: false,
        uniformBuffer: false,
        vertexArray: false,
    };

    public abstract initialize(): void;

    protected initializeShared(apiName: string): void {
        if (DEVELOPMENT) {
            console.groupCollapsed(`Initialize ${apiName}`);
        }
        this.context = this.createContext();
        if (DEVELOPMENT) {
            const version = this.context.getParameter(this.context.VERSION);
            const shadingLanguageVersion = this.context.getParameter(this.context.SHADING_LANGUAGE_VERSION);
            const vendor = this.context.getParameter(this.context.VENDOR);
            const renderer = this.context.getParameter(this.context.RENDERER);
            const debugInfo = this.context.getExtension(GL_DEBUG_RENDERER_INFO);
            const unmaskedVendor = debugInfo ? this.context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null;
            const unmaskedRenderer = debugInfo ? this.context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null;
            statistics.increment('api-calls', 7);
            console.log(`Version: ${version}`);
            console.log(`Shading language version: ${shadingLanguageVersion}`);
            console.log(`Vendor: ${vendor}`);
            console.log(`Renderer: ${renderer}`);
            if (debugInfo) {
                console.log(`Unmasked vendor: ${unmaskedVendor}`);
                console.log(`Unmasked renderer: ${unmaskedRenderer}`);
            }
        }
        this.context.enable(this.context.DEPTH_TEST);
        this.context.enable(this.context.CULL_FACE);
        statistics.increment('api-calls', 2);
        if (DEVELOPMENT) {
            const supportedExtensions = this.context.getSupportedExtensions();
            statistics.increment('api-calls', 1);
            if (supportedExtensions) {
                for (const extension of supportedExtensions) {
                    console.log(extension);
                }
            }
        }
        this.capabilitiesAndExtensions();
        if (DEVELOPMENT) {
            console.groupEnd();
        }
    }

    protected abstract capabilitiesAndExtensions(): void;

    protected abstract createContext(): WebGLRenderingContext | WebGL2RenderingContext;

    public getCapabilities(): RenderingCapabilities {
        return this.capabilities;
    }

    protected getContext(id: 'webgl' | 'webgl-experimental' | 'webgl2'): WebGLRenderingContext | WebGL2RenderingContext | null {
        const context = rendering.getCanvas().getContext(id, {
            powerPreference: 'high-performance',
            depth: false,
            antialias: false,
        }) as WebGLRenderingContext | WebGL2RenderingContext | null;
        statistics.increment('api-calls', 1);
        rendering.getCanvas().addEventListener('webglcontextlost', (event) => {
            console.log('WebGL context lost', event);
            main();
        });
        return context;
    }

    public getId(): WebGLRenderingContext | WebGL2RenderingContext {
        return this.context;
    }

    public async stop(): Promise<void> {
        this.context.flush();
        statistics.increment('api-calls', 1);
    }

    protected abstract vertexAttribDivisor(index: number, divisor: number): void;

    public configVbo(descriptor: VertexBufferDescriptor): void {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, descriptor.buffer.getId());
        statistics.increment('api-calls', 1);
        const layout = descriptor.layout;
        for (const va of layout.attributes) {
            this.context.vertexAttribPointer(
                va.index,
                this.getVertexAttribPointerSize(va.format),
                this.context.FLOAT,
                false,
                layout.stride,
                va.offset + (descriptor.offset ?? 0)
            );
            const instanced = layout.instanced ? 1 : 0;
            this.vertexAttribDivisor(va.index, instanced);
            this.context.enableVertexAttribArray(va.index);
            statistics.increment('api-calls', 3);
        }
    }

    public configEbo(buffer: Buffer): void {
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, buffer.getId());
        statistics.increment('api-calls', 1);
    }

    protected getVertexAttribPointerSize(format: VertexAttributeFormat): number {
        switch (format) {
            case VertexAttributeFormat.FLOAT_1:
                return 1;
            case VertexAttributeFormat.FLOAT_2:
                return 2;
            case VertexAttributeFormat.FLOAT_3:
                return 3;
            case VertexAttributeFormat.FLOAT_4:
                return 4;
        }
    }

    public configDraw(vertexDescriptor: VertexBufferDescriptor, indexBuffer: Buffer, instanceDescriptor?: VertexBufferDescriptor): void {
        this.configVbo(vertexDescriptor);
        if (instanceDescriptor) {
            this.configVbo(instanceDescriptor);
        }
        this.configEbo(indexBuffer);
    }

    public release(): void {}
}
