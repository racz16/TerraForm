import { Command } from '../command';
import { Pipeline } from '../pipeline';
import {
    GpuSetPipelneCommand,
    GpuSetUniformBufferCommand,
    GpuDrawIndexedCommand,
    GpuDrawInstancedIndexedCommand,
    GpuSetVertexBufferCommand,
    GpuSetIndexBufferCommand,
    GpuPushDebugGroupCommand,
    GpuPopDebugGroupCommand,
    GpuDebugLabelCommand,
} from './gpu-command';
import { GpuBuffer } from './gpu-buffer';
import {
    CommandBuffer,
    CommandBufferDescriptor,
    DrawInstancedIndexedCommandDescriptor,
    SetUniformBufferCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../command-buffer';
import { GpuTimeQuery } from './gpu-time-query';
import { rendering, statistics } from '../..';
import { getGpuContext } from '../rendering-context';
import { GpuPipeline } from './gpu-pipeline';

export class GpuCommandBuffer implements CommandBuffer {
    private commands: Command[] = [];
    private renderPassEncoder: GPURenderPassEncoder;
    private commandEncoder: GPUCommandEncoder;
    private query?: GpuTimeQuery;
    private pipeline?: Pipeline;
    private label?: string;

    public constructor(descriptor: CommandBufferDescriptor) {
        this.query = descriptor.query as GpuTimeQuery;
        this.label = descriptor.label;
        this.commandEncoder = getGpuContext()
            .getDevice()
            .createCommandEncoder({ label: `${this.label} command encoder` });
        this.renderPassEncoder = this.createRenderPassEncoder(this.commandEncoder);
        statistics.increment('api-calls', 1);
    }

    private createRenderPassEncoder(commandEncoder: GPUCommandEncoder): GPURenderPassEncoder {
        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: `${this.label} render pass`,
            depthStencilAttachment: {
                view: getGpuContext().getDepthView(),
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                depthReadOnly: false,
                depthClearValue: 1,
            },
            colorAttachments: [
                {
                    loadOp: 'clear',
                    clearValue: [0.7, 0.8, 1, 1],
                    storeOp: 'store',
                    view: getGpuContext().getCurrentTexture().createView(),
                },
            ],
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

    public addSetPipelineCommand(pipeline: Pipeline): void {
        this.pipeline = pipeline;
        this.commands.push(new GpuSetPipelneCommand(pipeline, this.renderPassEncoder));
    }

    public addSetVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void {
        this.commands.push(new GpuSetVertexBufferCommand(descriptor, this.renderPassEncoder));
    }

    public addSetIndexBufferCommand(indexBuffer: GpuBuffer): void {
        this.commands.push(new GpuSetIndexBufferCommand(indexBuffer, this.renderPassEncoder));
    }

    public addSetUniformBufferCommand(descriptor: SetUniformBufferCommandDescriptor): void {
        const pipeline = this.pipeline! as GpuPipeline;
        this.commands.push(new GpuSetUniformBufferCommand(descriptor, this.renderPassEncoder, pipeline));
    }

    public addSetUniformFloatCommand(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public addSetUniformVec2Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public addSetUniformVec3Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public addSetUniformVec4Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public addSetUniformMat2Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public addSetUniformMat3Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public addSetUniformMat4Command(): void {
        throw new Error('Individual uniforms are not supported in WebGPU');
    }

    public addDrawIndexedCommand(indexCount: number): void {
        this.commands.push(new GpuDrawIndexedCommand(indexCount, this.renderPassEncoder));
    }

    public addDrawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void {
        this.commands.push(new GpuDrawInstancedIndexedCommand(descriptor, this.renderPassEncoder));
    }

    public addPushDebugGroup(label: string): void {
        this.commands.push(new GpuPushDebugGroupCommand(label, this.renderPassEncoder));
    }

    public addPopDebugGroup(): void {
        this.commands.push(new GpuPopDebugGroupCommand(this.renderPassEncoder));
    }

    public addDebugLabel(label: string): void {
        this.commands.push(new GpuDebugLabelCommand(label, this.renderPassEncoder));
    }

    public execute(): void {
        for (const command of this.commands) {
            command.execute();
        }
        this.renderPassEncoder.end();
        if (rendering.getCapabilities().gpuTimer && this.query) {
            this.query.resolve(this.commandEncoder);
        }
        const commandBuffer = this.commandEncoder.finish({ label: `${this.label} command buffer` });
        getGpuContext().getDevice().queue.submit([commandBuffer]);
        statistics.increment('api-calls', 3);
        if (rendering.getCapabilities().gpuTimer && this.query) {
            this.query.update();
        }
    }
}
