import { statistics } from '../..';
import { Buffer } from '../buffer';
import { Command } from '../command';
import { Pipeline } from '../pipeline';
import { getRenderingCapabilities } from '../rendering-context';
import {
    DrawInstancedIndexedCommandDescriptor,
    Renderpass,
    RenderpassDescriptor,
    SetIndexedUniformCommandDescriptor,
    SetDrawConfigCommandDescriptor,
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
    GpuSetDrawConfigCommand,
} from './gpu-command';
import { GpuCommandBuffer } from './gpu-command-buffer';
import { getGpuContextWrapper } from './gpu-rendering-context';
import { GpuTexture } from './gpu-texture';
import { GpuTimeQuery } from './gpu-time-query';

export class GpuRenderpass implements Renderpass {
    private commandBuffer: GpuCommandBuffer;
    private descriptor: RenderpassDescriptor;
    private renderPassEncoder!: GPURenderPassEncoder;
    private commands: Command[] = [];
    private query?: GpuTimeQuery;
    private pipeline?: Pipeline;
    private label?: string;

    public constructor(descriptor: RenderpassDescriptor, commandBuffer: GpuCommandBuffer) {
        this.commandBuffer = commandBuffer;
        this.query = descriptor.query as GpuTimeQuery;
        this.label = descriptor.label;
        this.descriptor = descriptor;
    }

    private createRenderPassEncoder(descriptor: RenderpassDescriptor, commandEncoder: GPUCommandEncoder): GPURenderPassEncoder {
        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: `${this.label} renderpass`,
            colorAttachments: this.getColorAttachments(descriptor),
        };
        const depth = descriptor.depthStencilAttachment;
        if (depth) {
            renderPassDescriptor.depthStencilAttachment = {
                view: (depth.texture.getId() as GPUTexture).createView(),
                depthLoadOp: depth.clearValue ? 'clear' : 'load',
                depthClearValue: depth.clearValue,
                depthStoreOp: 'store',
            };
            statistics.increment('api-calls', 1);
        }
        if (getRenderingCapabilities().gpuTimer && this.query) {
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
        statistics.increment('api-calls', 1);
        if (descriptor.type === 'canvas') {
            return [
                {
                    loadOp: descriptor.clearColor ? 'clear' : 'load',
                    clearValue: descriptor.clearColor,
                    storeOp: 'store',
                    view: getGpuContextWrapper().getCurrentTexture().createView(),
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

    public setDrawConfigCommand(descriptor: SetDrawConfigCommandDescriptor): void {
        this.commands.push(new GpuSetDrawConfigCommand(descriptor, this));
    }

    public setIndexBufferCommand(indexBuffer: GpuBuffer): void {
        this.commands.push(new GpuSetIndexBufferCommand(indexBuffer, this));
    }

    public setUniformBufferCommand(descriptor: SetIndexedUniformCommandDescriptor<Buffer>): void {
        this.commands.push(new GpuSetUniformBufferCommand(descriptor, this, this.pipeline!));
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
        this.commands.push(new GpuSetUniformTextureCommand(descriptor, this, this.pipeline!));
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
        const commandEncoder = this.commandBuffer.getCommandEncoder();
        this.renderPassEncoder = this.createRenderPassEncoder(this.descriptor, commandEncoder);
        for (const command of this.commands) {
            command.execute();
        }
        this.commands.length = 0;
        this.renderPassEncoder.end();
        if (getRenderingCapabilities().gpuTimer && this.query) {
            this.query.resolve(commandEncoder);
        }
        statistics.increment('api-calls', 1);
    }

    public release(): void {}
}
