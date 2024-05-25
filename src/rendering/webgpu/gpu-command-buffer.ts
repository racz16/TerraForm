import { CommandBuffer } from '../command-buffer';
import { statistics } from '../..';
import { Renderpass, RenderpassDescriptor } from '../renderpass';
import { GpuRenderpass } from './gpu-renderpass';
import { getGpuDevice } from './gpu-rendering-context';
import { getRenderingCapabilities } from '../rendering-context';

export class GpuCommandBuffer implements CommandBuffer {
    protected device = getGpuDevice();
    private commandEncoder!: GPUCommandEncoder;
    private renderpasses: GpuRenderpass[] = [];
    private label?: string;

    public constructor(label?: string) {
        this.label = label;
    }

    public getCommandEncoder(): GPUCommandEncoder {
        return this.commandEncoder;
    }

    public createRenderpass(descriptor: RenderpassDescriptor): Renderpass {
        const renderpass = new GpuRenderpass(descriptor, this);
        this.renderpasses.push(renderpass);
        return renderpass;
    }

    public execute(): void {
        this.commandEncoder = this.device.createCommandEncoder({ label: `${this.label} command encoder` });
        for (const renderpass of this.renderpasses) {
            renderpass.execute();
        }
        const commandBuffer = this.commandEncoder.finish({ label: this.label });
        this.device.queue.submit([commandBuffer]);
        statistics.increment('api-calls', 3);
        if (getRenderingCapabilities().gpuTimer) {
            for (const renderpass of this.renderpasses) {
                renderpass.updateQuery();
            }
        }
    }
}
