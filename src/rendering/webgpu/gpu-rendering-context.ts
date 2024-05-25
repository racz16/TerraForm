import { main, rendering, statistics } from '../../index';
import { Buffer } from '../buffer';
import { VertexBufferDescriptor } from '../mesh';
import { RenderingCapabilities } from '../rendering-capabilities';
import { ApiError, RenderingContext } from '../rendering-context';
import { GpuRenderpass } from './gpu-renderpass';

export function getGpuContextWrapper(): GpuRenderingContext {
    return rendering.getContext() as GpuRenderingContext;
}

export function getGpuDevice(): GPUDevice {
    return getGpuContextWrapper().getDevice();
}

export class GpuRenderingContext implements RenderingContext {
    private deviceLostCount = 0;
    private canvasFormat!: GPUTextureFormat;
    private context!: GPUCanvasContext;
    private device!: GPUDevice;
    private valid = true;
    private capabilities: RenderingCapabilities = {
        ndcCube: false,
        uniformBuffer: true,
        instancedRendering: true,
        debugGroups: true,
        instanceOffset: true,
        depthTexture: true,
        uvUp: false,
        vertexArray: false,
        gpuTimer: false,
    };

    public async initialize(): Promise<void> {
        try {
            if (DEVELOPMENT) {
                console.groupCollapsed('Initialize WebGPU');
            }
            this.checkWebGPUSupport();
            const adapter = await this.getAdapter();
            this.device = await this.createDevice(adapter);
            this.context = this.getContext();
        } finally {
            if (DEVELOPMENT) {
                console.groupEnd();
            }
        }
    }

    public getId(): GPUCanvasContext {
        return this.context;
    }

    public getCapabilities(): RenderingCapabilities {
        return this.capabilities;
    }

    public getCanvasFormat(): GPUTextureFormat {
        return this.canvasFormat;
    }

    public getDevice(): GPUDevice {
        return this.device;
    }

    public getCurrentTexture(): GPUTexture {
        statistics.increment('api-calls', 1);
        return this.context.getCurrentTexture();
    }

    private checkWebGPUSupport(): void {
        if (!navigator.gpu) {
            if (DEVELOPMENT) {
                console.log("WebGPU isn't supported");
            }
            throw new ApiError();
        }
        if (DEVELOPMENT) {
            console.log('WebGPU is supported');
        }
    }

    private async getAdapter(): Promise<GPUAdapter> {
        if (DEVELOPMENT) {
            console.groupCollapsed('Adapter');
        }
        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        statistics.increment('api-calls', 1);
        if (!adapter || adapter.isFallbackAdapter) {
            throw new Error("Couldn't get an adapter");
        }
        if (DEVELOPMENT) {
            console.log('Adapter found');
            await this.logAdapterInfo(adapter);
            console.groupEnd();
        }
        return adapter;
    }

    private async logAdapterInfo(adapter: GPUAdapter): Promise<void> {
        if (DEVELOPMENT) {
            const adapterInfo = await adapter.requestAdapterInfo();
            statistics.increment('api-calls', 1);
            console.groupCollapsed('Adapter info');
            console.log(`Vendor: ${adapterInfo.vendor}`);
            console.log(`Architecture: ${adapterInfo.architecture}`);
            console.log(`Device: ${adapterInfo.device}`);
            console.log(`Description: ${adapterInfo.description}`);
            console.groupEnd();

            console.groupCollapsed('Adapter limits');
            console.log(adapter.limits);
            console.groupEnd();

            console.groupCollapsed('Adapter features');
            adapter.features.forEach((f) => console.log(f));
            console.groupEnd();
        }
    }

    private async createDevice(adapter: GPUAdapter): Promise<GPUDevice> {
        if (DEVELOPMENT) {
            console.groupCollapsed('Device');
        }
        const deviceDescriptor = this.createDeviceDescriptor(adapter);
        const device = await adapter.requestDevice(deviceDescriptor);
        statistics.increment('api-calls', 1);
        if (DEVELOPMENT) {
            console.log('Device found');
            this.logDeviceInfo(device);
        }
        device.lost.then((dli) => {
            if (dli.reason === 'destroyed') {
                return;
            }
            console.error('Device lost');
            console.error(`Reason: ${dli.reason}`);
            console.error(`Message: ${dli.message}`);
            this.deviceLostCount++;
            if (this.deviceLostCount <= 5) {
                main();
            }
        });
        if (DEVELOPMENT) {
            console.log('Device subscribed to the device lost event');
            console.groupEnd();
        }
        return device;
    }

    private createDeviceDescriptor(adapter: GPUAdapter): GPUDeviceDescriptor {
        const deviceDescriptor: GPUDeviceDescriptor = {};
        const TIMESTAMP_QUERY_FEATURE = 'timestamp-query';
        this.capabilities.gpuTimer = adapter.features.has(TIMESTAMP_QUERY_FEATURE);
        if (this.capabilities.gpuTimer) {
            deviceDescriptor.requiredFeatures = [TIMESTAMP_QUERY_FEATURE];
            if (DEVELOPMENT) {
                console.log(`'${TIMESTAMP_QUERY_FEATURE}' is supported`);
            }
        } else {
            if (DEVELOPMENT) {
                console.log(`'${TIMESTAMP_QUERY_FEATURE}' is NOT supported`);
            }
        }
        return deviceDescriptor;
    }

    private logDeviceInfo(device: GPUDevice): void {
        if (DEVELOPMENT) {
            console.groupCollapsed('Device limits');
            console.log(device.limits);
            console.groupEnd();

            console.groupCollapsed('Device features');
            device.features.forEach((f) => console.log(f));
            console.groupEnd();
        }
    }

    private getContext(): GPUCanvasContext {
        if (DEVELOPMENT) {
            console.groupCollapsed('Context');
        }
        // TSC doesn't seem to handle the situation well, so I have to declare the type explicitly
        const context = rendering.getCanvas().getContext('webgpu') as GPUCanvasContext | null;
        if (!context) {
            throw new Error("Couldn't create a WebGPU context");
        }
        if (DEVELOPMENT) {
            console.log('Context created');
        }
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        if (DEVELOPMENT) {
            console.log(`Preferred canvas format: ${this.canvasFormat}`);
        }
        context.configure({ format: this.canvasFormat, device: this.device });
        if (DEVELOPMENT) {
            console.log('Context configured');
            console.groupEnd();
        }
        statistics.increment('api-calls', 3);
        return context;
    }

    public configVertexBuffer(renderpass: GpuRenderpass, descriptor: VertexBufferDescriptor): void {
        renderpass.getEncoder().setVertexBuffer(descriptor.index, descriptor.buffer.getId(), descriptor.offset ?? 0);
        statistics.increment('api-calls', 1);
    }

    public configIndexBuffer(renderpass: GpuRenderpass, buffer: Buffer): void {
        renderpass.getEncoder().setIndexBuffer(buffer.getId(), 'uint16');
        statistics.increment('api-calls', 1);
    }

    public async stop(): Promise<void> {
        await this.device.queue.onSubmittedWorkDone();
        statistics.increment('api-calls', 1);
    }

    public release(): void {
        if (this.valid) {
            this.context?.unconfigure();
            this.device?.destroy();
            statistics.increment('api-calls', 2);
            this.valid = false;
        }
    }
}
