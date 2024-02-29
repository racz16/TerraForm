import { statistics } from '../..';
import { Command } from '../command';
import {
    DrawInstancedIndexedCommandDescriptor,
    SetUniformBufferCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../command-buffer';
import { Pipeline, VertexAttributeFormat } from '../pipeline';
import { getGl2Context } from '../rendering-context';
import { Shader } from '../shader';
import { Gl2Buffer } from './gl2-buffer';
import { Gl2Shader } from './gl2-shader';

export class Gl2SetVertexBufferCommand implements Command {
    private pipeline: Pipeline;
    private descriptor: SetVertexBufferCommandDescriptor;

    public constructor(descriptor: SetVertexBufferCommandDescriptor, pipeline: Pipeline) {
        this.descriptor = descriptor;
        this.pipeline = pipeline;
    }

    public execute(): void {
        const vertexBuffer = this.descriptor.vertexBuffer as Gl2Buffer;
        const context = getGl2Context().getId();
        context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer.getId());
        statistics.increment('api-calls', 1);
        const vbl = this.pipeline.getDescriptor().vertexBuffers[this.descriptor.index];
        for (const va of vbl.attributes) {
            context.vertexAttribPointer(
                va.index,
                this.getSize(va.format),
                context.FLOAT,
                false,
                vbl.stride,
                va.offset + (this.descriptor.offset ?? 0)
            );
            if (vbl.isInstanced) {
                context.vertexAttribDivisor(va.index, 1);
                statistics.increment('api-calls', 1);
            }
            context.enableVertexAttribArray(va.index);
            statistics.increment('api-calls', 2);
        }
    }

    private getSize(format: VertexAttributeFormat): number {
        switch (format) {
            case VertexAttributeFormat.FLOAT_1:
                return 1;
            case VertexAttributeFormat.FLOAT_2:
                return 2;
            case VertexAttributeFormat.FLOAT_3:
                return 3;
            case VertexAttributeFormat.FLOAT_4:
                return 4;
        }
    }
}

export class Gl2SetUniformBufferCommand implements Command {
    private descriptor: SetUniformBufferCommandDescriptor;
    private shader: Shader;

    public constructor(descriptor: SetUniformBufferCommandDescriptor, shader: Shader) {
        this.descriptor = descriptor;
        this.shader = shader;
    }

    public execute(): void {
        const context = getGl2Context().getId();
        const uniformBuffer = this.descriptor.uniformBuffer as Gl2Buffer;
        const shader = this.shader as Gl2Shader;
        const index = shader.getUniformBlockIndex(this.descriptor.name);
        context.uniformBlockBinding(shader.getId(), index, this.descriptor.index);
        context.bindBufferBase(context.UNIFORM_BUFFER, this.descriptor.index, uniformBuffer.getId());
        statistics.increment('api-calls', 2);
    }
}

export class Gl2DrawInstancedIndexedCommand implements Command {
    private descriptor: DrawInstancedIndexedCommandDescriptor;

    public constructor(descriptor: DrawInstancedIndexedCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        const context = getGl2Context().getId();
        context.drawElementsInstanced(
            context.TRIANGLES,
            this.descriptor.indexCount,
            context.UNSIGNED_SHORT,
            0,
            this.descriptor.instanceCount
        );
        statistics.increment('draw-calls', 1);
        statistics.increment('rendered-instances', this.descriptor.instanceCount);
    }
}
