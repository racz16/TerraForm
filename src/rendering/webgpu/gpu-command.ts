import { statistics } from '../..';
import { Command } from '../command';
import { DrawInstancedIndexedCommandDescriptor, SetIndexedUniformCommandDescriptor, SetVertexBufferCommandDescriptor } from '../renderpass';
import { Pipeline } from '../pipeline';
import { GpuBuffer } from './gpu-buffer';
import { GpuPipeline } from './gpu-pipeline';
import { GpuRenderpass } from './gpu-renderpass';
import { Texture } from '../texture';
import { GpuTexture } from './gpu-texture';
import { Buffer } from '../buffer';

export class GpuSetPipelneCommand implements Command {
    private pipeline: Pipeline;
    private renderpass: GpuRenderpass;

    public constructor(pipeline: Pipeline, renderpass: GpuRenderpass) {
        this.pipeline = pipeline;
        this.renderpass = renderpass;
    }

    public execute(): void {
        this.renderpass.getEncoder().setPipeline(this.pipeline.getId());
        statistics.increment('api-calls', 1);
    }
}

export class GpuSetVertexBufferCommand implements Command {
    private descriptor: SetVertexBufferCommandDescriptor;
    private renderpass: GpuRenderpass;

    public constructor(descriptor: SetVertexBufferCommandDescriptor, renderpass: GpuRenderpass) {
        this.descriptor = descriptor;
        this.renderpass = renderpass;
    }

    public execute(): void {
        const vertexBuffer = this.descriptor.vertexBuffer as GpuBuffer;
        this.renderpass.getEncoder().setVertexBuffer(this.descriptor.index, vertexBuffer.getId(), this.descriptor.offset ?? 0);
        statistics.increment('api-calls', 1);
    }
}

export class GpuSetIndexBufferCommand implements Command {
    private indexBuffer: GpuBuffer;
    private renderpass: GpuRenderpass;

    public constructor(indexBuffer: GpuBuffer, renderpass: GpuRenderpass) {
        this.indexBuffer = indexBuffer;
        this.renderpass = renderpass;
    }

    public execute(): void {
        this.renderpass.getEncoder().setIndexBuffer(this.indexBuffer.getId(), 'uint16');
        statistics.increment('api-calls', 1);
    }
}

export class GpuSetUniformBufferCommand implements Command {
    private descriptor: SetIndexedUniformCommandDescriptor<Buffer>;
    private renderpass: GpuRenderpass;
    private pipeline: GpuPipeline;

    public constructor(descriptor: SetIndexedUniformCommandDescriptor<Buffer>, renderpass: GpuRenderpass, pipeline: GpuPipeline) {
        this.descriptor = descriptor;
        this.renderpass = renderpass;
        this.pipeline = pipeline;
    }

    public execute(): void {
        const uniformBuffer = this.descriptor.value as GpuBuffer;
        const bindGroup = uniformBuffer.getBindGroup(this.pipeline.getId(), this.descriptor.index);
        this.renderpass.getEncoder().setBindGroup(this.descriptor.index, bindGroup);
        statistics.increment('api-calls', 1);
    }
}

export class GpuSetUniformTextureCommand implements Command {
    private descriptor: SetIndexedUniformCommandDescriptor<Texture>;
    private renderpass: GpuRenderpass;
    private pipeline: GpuPipeline;

    public constructor(descriptor: SetIndexedUniformCommandDescriptor<Texture>, renderpass: GpuRenderpass, pipeline: GpuPipeline) {
        this.descriptor = descriptor;
        this.renderpass = renderpass;
        this.pipeline = pipeline;
    }

    public execute(): void {
        const texture = this.descriptor.value as GpuTexture;
        const bindGroup = texture.getBindGroup(this.pipeline.getId(), this.descriptor.index);
        this.renderpass.getEncoder().setBindGroup(this.descriptor.index, bindGroup);
        statistics.increment('api-calls', 1);
    }
}

export class GpuDrawIndexedCommand implements Command {
    private indexCount: number;
    private renderpass: GpuRenderpass;

    public constructor(indexCount: number, renderpass: GpuRenderpass) {
        this.indexCount = indexCount;
        this.renderpass = renderpass;
    }

    public execute(): void {
        this.renderpass.getEncoder().drawIndexed(this.indexCount);
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', 1);
    }
}

export class GpuDrawInstancedIndexedCommand implements Command {
    private descriptor: DrawInstancedIndexedCommandDescriptor;
    private renderpass: GpuRenderpass;

    public constructor(descriptor: DrawInstancedIndexedCommandDescriptor, renderpass: GpuRenderpass) {
        this.descriptor = descriptor;
        this.renderpass = renderpass;
    }

    public execute(): void {
        this.renderpass
            .getEncoder()
            .drawIndexed(this.descriptor.indexCount, this.descriptor.instanceCount, 0, 0, this.descriptor.instanceOffset);
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', this.descriptor.instanceCount);
    }
}

export class GpuPushDebugGroupCommand implements Command {
    private label: string;
    private renderpass: GpuRenderpass;

    public constructor(label: string, renderpass: GpuRenderpass) {
        this.label = label;
        this.renderpass = renderpass;
    }

    public execute(): void {
        this.renderpass.getEncoder().pushDebugGroup(this.label);
        statistics.increment('api-calls', 1);
    }
}

export class GpuPopDebugGroupCommand implements Command {
    private renderpass: GpuRenderpass;

    public constructor(renderpass: GpuRenderpass) {
        this.renderpass = renderpass;
    }

    public execute(): void {
        this.renderpass.getEncoder().popDebugGroup();
        statistics.increment('api-calls', 1);
    }
}

export class GpuAddDebugLabelCommand implements Command {
    private label: string;
    private renderpass: GpuRenderpass;

    public constructor(label: string, renderpass: GpuRenderpass) {
        this.label = label;
        this.renderpass = renderpass;
    }

    public execute(): void {
        this.renderpass.getEncoder().insertDebugMarker(this.label);
        statistics.increment('api-calls', 1);
    }
}
