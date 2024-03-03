import { main, rendering, statistics } from '../..';
import { RenderingContext } from '../rendering-context';
import { GL_DEBUG_RENDERER_INFO } from './gl-extensions';

export abstract class GlRenderingContext implements RenderingContext {
    protected context!: WebGLRenderingContextBase;

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
        rendering.getCapabilities().isNdcCube = true;
        rendering.getCapabilities().instanceOffset = false;
        this.capabilitiesAndExtensions();
        if (DEVELOPMENT) {
            console.groupEnd();
        }
    }

    protected abstract capabilitiesAndExtensions(): void;

    protected abstract createContext(): WebGLRenderingContextBase;

    protected getContext(id: 'webgl' | 'webgl-experimental' | 'webgl2'): WebGLRenderingContextBase | null {
        const context = rendering.getCanvas().getContext(id, {
            powerPreference: 'high-performance',
            depth: true,
            antialias: false,
        }) as WebGLRenderingContext | null;
        statistics.increment('api-calls', 1);
        rendering.getCanvas().addEventListener('webglcontextlost', (event) => {
            console.log('WebGL context lost', event);
            main();
        });
        return context;
    }

    public getId(): WebGLRenderingContextBase {
        return this.context;
    }

    public handleResize(): void {}

    public async stop(): Promise<void> {
        this.context.flush();
        statistics.increment('api-calls', 1);
    }

    public release(): void {}
}
