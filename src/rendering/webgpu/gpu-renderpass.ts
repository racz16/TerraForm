import { rendering, statistics } from '../..';
import { Buffer } from '../buffer';
import { Command } from '../command';
import { Pipeline } from '../pipeline';
import { getGpuContext } from '../rendering-context';
import {
    DrawInstancedIndexedCommandDescriptor,
    Renderpass,
    RenderpassDescriptor,
    SetIndexedUniformCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../renderpass';
import { Texture } from '../texture';
import { GpuBuffer } from './gpu-buffer';
import {
    GpuSetPipelneCommand,
    GpuSetVertexBufferCommand,
    GpuSetIndexBufferCommand,
    GpuSetUniformBufferCommand,
    GpuDrawIndexedCommand,
    GpuDrawInstancedIndexedCommand,
    GpuPushDebugGroupCommand,
    GpuPopDebugGroupCommand,
    GpuAddDebugLabelCommand,
    GpuSetUniformTextureCommand,
} from './gpu-command';
import { GpuPipeline } from './gpu-pipeline';
import { GpuTexture } from './gpu-texture';
import { GpuTimeQuery } from './gpu-time-query';

export class GpuRenderpass implements Renderpass {
    private commandEncoder: GPUCommandEncoder;
    private descriptor: RenderpassDescriptor;
    private renderPassEncoder!: GPURenderPassEncoder;
    private commands: Command[] = [];
    private query?: GpuTimeQuery;
    private pipeline?: Pipeline;
    private label?: string;

    public constructor(descriptor: RenderpassDescriptor, commandEncoder: GPUCommandEncoder) {
        this.commandEncoder = commandEncoder;
        this.query = descriptor.query as GpuTimeQuery;
        this.label = descriptor.label;
        this.descriptor = descriptor;
    }

    private createRenderPassEncoder(descriptor: RenderpassDescriptor, commandEncoder: GPUCommandEncoder): GPURenderPassEncoder {
        const depth = descriptor.depthStencilAttachment;
        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: `${this.label} renderpass`,
            depthStencilAttachment: depth
                ? {
                      view: (depth.texture.getId() as GPUTexture).createView(),
                      depthLoadOp: depth.clearValue ? 'clear' : 'load',
                      depthClearValue: depth.clearValue,
                      depthStoreOp: 'store',
                  }
                : undefined,
            colorAttachments: this.getColorAttachments(descriptor),
        };
        if (rendering.getCapabilities().gpuTimer && this.query) {
            renderPassDescriptor.timestampWrites = {
                querySet: this.query.getId(),
                beginningOfPassWriteIndex: 0,
                endOfPassWriteIndex: 1,
            };
        }
        statistics.increment('api-calls', 2);
        return commandEncoder.beginRenderPass(renderPassDescriptor);
    }

    private getColorAttachments(descriptor: RenderpassDescriptor): GPURenderPassColorAttachment[] {
        if (descriptor.type === 'canvas') {
            return [
                {
                    loadOp: descriptor.clearColor ? 'clear' : 'load',
                    clearValue: descriptor.clearColor,
                    storeOp: 'store',
                    view: getGpuContext().getCurrentTexture().createView(),
                },
            ];
        } else {
            return descriptor.colorAttachments.map((ca) => ({
                loadOp: ca.clearColor ? 'clear' : 'load',
                clearValue: ca.clearColor,
                storeOp: 'store',
                view: (ca.texture as GpuTexture).getView(),
            }));
        }
    }

    public setPipelineCommand(pipeline: Pipeline): void {
        this.pipeline = pipeline;
        this.commands.push(new GpuSetPipelneCommand(pipeline, this));
    }

    public setVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void {
        this.commands.push(new GpuSetVertexBufferCommand(descriptor, this));
    }

    public setIndexBufferCommand(indexBuffer: GpuBuffer): void {
        this.commands.push(new GpuSetIndexBufferCommand(indexBuffer, this));
    }

    public setUniformBufferCommand(descriptor: SetIndexedUniformCommandDescriptor<Buffer>): void {
        const pipeline = this.pipeline! as GpuPipeline;
        this.commands.push(new GpuSetUniformBufferCommand(descriptor, this, pipeline));
    }

    public setUniformFloatCommand(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public setUniformVec2Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public setUniformVec3Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public setUniformVec4Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public setUniformMat2Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public setUniformMat3Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public setUniformMat4Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public setUniformTextureCommand(descriptor: SetIndexedUniformCommandDescriptor<Texture>): void {
        const pipeline = this.pipeline! as GpuPipeline;
        this.commands.push(new GpuSetUniformTextureCommand(descriptor, this, pipeline));
    }

    public drawIndexedCommand(indexCount: number): void {
        this.commands.push(new GpuDrawIndexedCommand(indexCount, this));
    }

    public drawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void {
        this.commands.push(new GpuDrawInstancedIndexedCommand(descriptor, this));
    }

    public pushDebugGroupCommand(label: string): void {
        this.commands.push(new GpuPushDebugGroupCommand(label, this));
    }

    public popDebugGroupCommand(): void {
        this.commands.push(new GpuPopDebugGroupCommand(this));
    }

    public addDebugLabelCommand(label: string): void {
        this.commands.push(new GpuAddDebugLabelCommand(label, this));
    }

    public getEncoder(): GPURenderPassEncoder {
        return this.renderPassEncoder;
    }

    public updateQuery(): void {
        this.query?.update();
    }

    public execute(): void {
        this.renderPassEncoder = this.createRenderPassEncoder(this.descriptor, this.commandEncoder);
        for (const command of this.commands) {
            command.execute();
        }
        this.renderPassEncoder.end();
        if (rendering.getCapabilities().gpuTimer && this.query) {
            this.query.resolve(this.commandEncoder);
        }
        statistics.increment('api-calls', 1);
    }
}