import { statistics } from '../..';
import { Command } from '../command';
import {
    DrawInstancedIndexedCommandDescriptor,
    SetUniformBufferCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../command-buffer';
import { Pipeline } from '../pipeline';
import { GpuBuffer } from './gpu-buffer';
import { GpuPipeline } from './gpu-pipeline';

export class GpuSetPipelneCommand implements Command {
    private pipeline: Pipeline;
    private renderPassEncoder: GPURenderPassEncoder;

    public constructor(pipeline: Pipeline, renderPassEncoder: GPURenderPassEncoder) {
        this.pipeline = pipeline;
        this.renderPassEncoder = renderPassEncoder;
    }

    public execute(): void {
        this.renderPassEncoder.setPipeline(this.pipeline.getId());
        statistics.increment('api-calls', 1);
    }
}

export class GpuSetVertexBufferCommand implements Command {
    private descriptor: SetVertexBufferCommandDescriptor;
    private renderPassEncoder: GPURenderPassEncoder;

    public constructor(descriptor: SetVertexBufferCommandDescriptor, renderPassEncoder: GPURenderPassEncoder) {
        this.descriptor = descriptor;
        this.renderPassEncoder = renderPassEncoder;
    }

    public execute(): void {
        const vertexBuffer = this.descriptor.vertexBuffer as GpuBuffer;
        this.renderPassEncoder.setVertexBuffer(this.descriptor.index, vertexBuffer.getId(), this.descriptor.offset ?? 0);
        statistics.increment('api-calls', 1);
    }
}

export class GpuSetIndexBufferCommand implements Command {
    private indexBuffer: GpuBuffer;
    private renderPassEncoder: GPURenderPassEncoder;

    public constructor(indexBuffer: GpuBuffer, renderPassEncoder: GPURenderPassEncoder) {
        this.indexBuffer = indexBuffer;
        this.renderPassEncoder = renderPassEncoder;
    }

    public execute(): void {
        this.renderPassEncoder.setIndexBuffer(this.indexBuffer.getId(), 'uint16');
        statistics.increment('api-calls', 1);
    }
}

export class GpuSetUniformBufferCommand implements Command {
    private descriptor: SetUniformBufferCommandDescriptor;
    private renderPassEncoder: GPURenderPassEncoder;
    private pipeline: GpuPipeline;

    public constructor(descriptor: SetUniformBufferCommandDescriptor, renderPassEncoder: GPURenderPassEncoder, pipeline: GpuPipeline) {
        this.descriptor = descriptor;
        this.renderPassEncoder = renderPassEncoder;
        this.pipeline = pipeline;
    }

    public execute(): void {
        const uniformBuffer = this.descriptor.uniformBuffer as GpuBuffer;
        const bindGroup = uniformBuffer.getBindGroup(this.pipeline.getId(), this.descriptor.index);
        this.renderPassEncoder.setBindGroup(this.descriptor.index, bindGroup);
        statistics.increment('api-calls', 1);
    }
}

export class GpuDrawIndexedCommand implements Command {
    private indexCount: number;
    private renderPassEncoder: GPURenderPassEncoder;

    public constructor(indexCount: number, renderPassEncoder: GPURenderPassEncoder) {
        this.indexCount = indexCount;
        this.renderPassEncoder = renderPassEncoder;
    }

    public execute(): void {
        this.renderPassEncoder.drawIndexed(this.indexCount);
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', 1);
    }
}

export class GpuDrawInstancedIndexedCommand implements Command {
    private descriptor: DrawInstancedIndexedCommandDescriptor;
    private renderPassEncoder: GPURenderPassEncoder;

    public constructor(descriptor: DrawInstancedIndexedCommandDescriptor, renderPassEncoder: GPURenderPassEncoder) {
        this.descriptor = descriptor;
        this.renderPassEncoder = renderPassEncoder;
    }

    public execute(): void {
        this.renderPassEncoder.drawIndexed(this.descriptor.indexCount, this.descriptor.instanceCount);
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', this.descriptor.instanceCount);
    }
}

export class GpuPushDebugGroupCommand implements Command {
    private label: string;
    private renderPassEncoder: GPURenderPassEncoder;

    public constructor(label: string, renderPassEncoder: GPURenderPassEncoder) {
        this.label = label;
        this.renderPassEncoder = renderPassEncoder;
    }

    public execute(): void {
        this.renderPassEncoder.pushDebugGroup(this.label);
        statistics.increment('api-calls', 1);
    }
}

export class GpuPopDebugGroupCommand implements Command {
    private renderPassEncoder: GPURenderPassEncoder;

    public constructor(renderPassEncoder: GPURenderPassEncoder) {
        this.renderPassEncoder = renderPassEncoder;
    }

    public execute(): void {
        this.renderPassEncoder.popDebugGroup();
        statistics.increment('api-calls', 1);
    }
}

export class GpuDebugLabelCommand implements Command {
    private label: string;
    private renderPassEncoder: GPURenderPassEncoder;

    public constructor(label: string, renderPassEncoder: GPURenderPassEncoder) {
        this.label = label;
        this.renderPassEncoder = renderPassEncoder;
    }

    public execute(): void {
        this.renderPassEncoder.insertDebugMarker(this.label);
        statistics.increment('api-calls', 1);
    }
}
