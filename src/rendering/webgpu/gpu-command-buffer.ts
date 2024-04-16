import { CommandBuffer } from '../command-buffer';
import { rendering, statistics } from '../..';
import { getGpuContext } from '../rendering-context';
import { Renderpass, RenderpassDescriptor } from '../renderpass';
import { GpuRenderpass } from './gpu-renderpass';

export class GpuCommandBuffer implements CommandBuffer {
    private commandEncoder: GPUCommandEncoder;
    private renderpasses: GpuRenderpass[] = [];
    private label?: string;

    public constructor(label?: string) {
        this.label = label;
        this.commandEncoder = getGpuContext()
            .getDevice()
            .createCommandEncoder({ label: `${this.label} command encoder` });
        statistics.increment('api-calls', 1);
    }

    public createRenderpass(descriptor: RenderpassDescriptor): Renderpass {
        const renderpass = new GpuRenderpass(descriptor, this.commandEncoder);
        this.renderpasses.push(renderpass);
        return renderpass;
    }

    public execute(): void {
        for (const renderpass of this.renderpasses) {
            renderpass.execute();
        }
        const commandBuffer = this.commandEncoder.finish({ label: this.label });
        getGpuContext().getDevice().queue.submit([commandBuffer]);
        statistics.increment('api-calls', 2);
        if (rendering.getCapabilities().gpuTimer) {
            for (const renderpass of this.renderpasses) {
                renderpass.updateQuery();
            }
        }
    }
}
