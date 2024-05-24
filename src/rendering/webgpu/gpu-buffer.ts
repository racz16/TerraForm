import { statistics } from '../..';
import { mathTypeToTypedArray } from '../../utility';
import { Buffer, BufferUsage, BufferDescriptor, BufferDataDescriptor } from '../buffer';
import { getGpuContext } from '../rendering-context';

export class GpuBuffer implements Buffer {
    private buffer: GPUBuffer;
    private bindGroup: GPUBindGroup | null = null;
    private size: number;
    private usage: BufferUsage;
    private valid = true;

    public constructor(descriptor: BufferDescriptor) {
        this.usage = descriptor.usage;
        this.size = this.computeSize(descriptor);
        this.buffer = this.createBuffer(descriptor);
        this.initializeBufferData(descriptor);
        statistics.increment('buffer-data', this.size);
    }

    private computeSize(descriptor: BufferDescriptor): number {
        if (descriptor.type === 'size' || descriptor.type === 'data-callback') {
            return descriptor.size;
        } else {
            return descriptor.dataLength ?? descriptor.data.byteLength;
        }
    }

    private createBuffer(descriptor: BufferDescriptor): GPUBuffer {
        const nativeDescriptor: GPUBufferDescriptor = {
            size: this.size,
            usage: this.getGpuUsage(),
            label: descriptor.label,
            mappedAtCreation: descriptor.type === 'data-callback',
        };
        statistics.increment('api-calls', 1);
        return getGpuContext().getDevice().createBuffer(nativeDescriptor);
    }

    private initializeBufferData(descriptor: BufferDescriptor): void {
        if (descriptor.type === 'data') {
            this.setData({
                type: 'buffer',
                data: descriptor.data,
                dataOffset: descriptor.dataOffset,
                dataLength: descriptor.dataLength,
            });
        } else if (descriptor.type === 'data-callback') {
            const data = this.buffer.getMappedRange();
            descriptor.callback(data);
            this.buffer.unmap();
            statistics.increment('api-calls', 2);
        }
    }

    public getBindGroup(pipeline: GPURenderPipeline, index: number): GPUBindGroup {
        if (!this.bindGroup) {
            this.bindGroup = getGpuContext()
                .getDevice()
                .createBindGroup({
                    layout: pipeline.getBindGroupLayout(index),
                    entries: [{ binding: 0, resource: { buffer: this.buffer } }],
                });
            statistics.increment('api-calls', 2);
        }
        return this.bindGroup;
    }

    private getGpuUsage(): number {
        let result = GPUBufferUsage.COPY_DST;
        if (this.usage === BufferUsage.VERTEX) {
            result |= GPUBufferUsage.VERTEX;
        }
        if (this.usage === BufferUsage.INDEX) {
            result |= GPUBufferUsage.INDEX;
        }
        if (this.usage === BufferUsage.UNIFORM) {
            result |= GPUBufferUsage.UNIFORM;
        }
        return result;
    }

    public getId(): GPUBuffer {
        return this.buffer;
    }

    public getSize(): number {
        return this.size;
    }

    public getUsage(): BufferUsage {
        return this.usage;
    }

    public setData(data: BufferDataDescriptor): void {
        if (data.type === 'math') {
            this.setData({ type: 'buffer', data: mathTypeToTypedArray(data.data), offset: data.offset });
        } else {
            getGpuContext()
                .getDevice()
                .queue.writeBuffer(this.buffer, data.offset ?? 0, data.data, data.dataOffset, data.dataLength);
            statistics.increment('api-calls', 1);
        }
    }

    public release(): void {
        if (this.valid) {
            this.buffer.destroy();
            statistics.increment('buffer-data', -this.size);
            statistics.increment('api-calls', 1);
            this.size = 0;
            this.valid = false;
        }
    }
}
