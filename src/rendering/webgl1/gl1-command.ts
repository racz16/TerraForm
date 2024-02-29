import { statistics } from '../..';
import { Command } from '../command';
import { DrawInstancedIndexedCommandDescriptor, SetVertexBufferCommandDescriptor } from '../command-buffer';
import { Pipeline, VertexAttributeFormat } from '../pipeline';
import { getGl1Context } from '../rendering-context';
import { Gl1Buffer } from './gl1-buffer';

export class Gl1SetVertexBufferCommand implements Command {
    private pipeline: Pipeline;
    private descriptor: SetVertexBufferCommandDescriptor;

    public constructor(descriptor: SetVertexBufferCommandDescriptor, pipeline: Pipeline) {
        this.descriptor = descriptor;
        this.pipeline = pipeline;
    }

    public execute(): void {
        const vertexBuffer = this.descriptor.vertexBuffer as Gl1Buffer;
        const context = getGl1Context().getId();
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
                getGl1Context().getInstancedRenderingExtension()!.vertexAttribDivisorANGLE(va.index, 1);
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

export class Gl1DrawInstancedIndexedCommand implements Command {
    private descriptor: DrawInstancedIndexedCommandDescriptor;

    public constructor(descriptor: DrawInstancedIndexedCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        const context = getGl1Context().getId();
        getGl1Context()
            .getInstancedRenderingExtension()!
            .drawElementsInstancedANGLE(
                context.TRIANGLES,
                this.descriptor.indexCount,
                context.UNSIGNED_SHORT,
                0,
                this.descriptor.instanceCount
            );
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', this.descriptor.instanceCount);
    }
}
