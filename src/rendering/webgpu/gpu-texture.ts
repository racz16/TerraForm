import { statistics } from '../..';
import { Texture, Texture2dDescriptor } from '../texture';
import { getGpuDevice } from './gpu-rendering-context';

export class GpuTexture implements Texture {
    protected device = getGpuDevice();
    private id: GPUTexture;
    private sampler: GPUSampler;
    private view?: GPUTextureView;
    private bindGroup?: GPUBindGroup;
    private size = 0;
    private valid = true;

    public constructor(descriptor: Texture2dDescriptor) {
        this.id = this.device.createTexture({
            dimension: '2d',
            format: this.getFormat(descriptor),
            usage: this.getUsage(descriptor),
            size: { width: descriptor.width, height: descriptor.height },
            label: descriptor.label,
        });
        this.sampler = this.device.createSampler({
            label: descriptor.label,
            minFilter: 'nearest',
            magFilter: 'nearest',
            mipmapFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
            addressModeW: 'clamp-to-edge',
        });
        this.size = descriptor.width * descriptor.height * 4;
        statistics.increment('texture-data', this.size);
        statistics.increment('api-calls', 2);
    }

    private getUsage(descriptor: Texture2dDescriptor): number {
        let result = 0;
        if (descriptor.rendered) {
            result |= GPUTextureUsage.RENDER_ATTACHMENT;
        }
        if (descriptor.sampled) {
            result |= GPUTextureUsage.TEXTURE_BINDING;
        }
        return result;
    }

    public getId(): GPUTexture {
        return this.id;
    }

    public getSampler(): GPUSampler {
        return this.sampler;
    }

    public getBindGroup(pipeline: GPURenderPipeline, index: number): GPUBindGroup {
        if (!this.bindGroup) {
            this.bindGroup = this.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(index),
                entries: [
                    { binding: 0, resource: this.sampler },
                    { binding: 1, resource: this.getView() },
                ],
            });
            statistics.increment('api-calls', 1);
        }
        return this.bindGroup;
    }

    private getFormat(descriptor: Texture2dDescriptor): GPUTextureFormat {
        switch (descriptor.format) {
            case 'rgba8':
                return 'rgba8unorm';
            case 'depth':
                return 'depth32float';
        }
    }

    public getView(): GPUTextureView {
        if (!this.view) {
            this.view = this.id.createView();
            statistics.increment('api-calls', 1);
        }
        return this.view;
    }

    public release(): void {
        if (this.valid) {
            this.id.destroy();
            statistics.increment('texture-data', -this.size);
            statistics.increment('api-calls', 1);
            this.valid = false;
        }
    }
}
