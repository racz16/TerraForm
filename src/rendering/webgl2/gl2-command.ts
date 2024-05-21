import { statistics } from '../..';
import { Command } from '../command';
import {
    DrawInstancedIndexedCommandDescriptor,
    SetIndexedUniformCommandDescriptor,
    SetDrawConfigCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../renderpass';
import { getGl2Context } from '../rendering-context';
import { Shader } from '../shader';
import { Gl2Buffer } from './gl2-buffer';
import { Gl2Shader } from './gl2-shader';
import { Buffer } from '../buffer';
import { Gl2DrawConfig } from './gl2-draw-config';

export class Gl2SetVertexBufferCommand implements Command {
    private descriptor: SetVertexBufferCommandDescriptor;

    public constructor(descriptor: SetVertexBufferCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        getGl2Context().configVbo(this.descriptor);
    }
}

export class Gl2SetDrawConfigCommand implements Command {
    private descriptor: SetDrawConfigCommandDescriptor;

    public constructor(descriptor: SetDrawConfigCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        const mesh = this.descriptor.drawConfig as Gl2DrawConfig;
        const context = getGl2Context().getId();
        context.bindVertexArray(mesh.getId());
        statistics.increment('api-calls', 1);
    }
}

export class Gl2SetUniformBufferCommand implements Command {
    private descriptor: SetIndexedUniformCommandDescriptor<Buffer>;
    private shader: Shader;

    public constructor(descriptor: SetIndexedUniformCommandDescriptor<Buffer>, shader: Shader) {
        this.descriptor = descriptor;
        this.shader = shader;
    }

    public execute(): void {
        const context = getGl2Context().getId();
        const uniformBuffer = this.descriptor.value as Gl2Buffer;
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
        if (DEVELOPMENT) {
            if (descriptor.instanceOffset) {
                throw new Error('Instance offset is not supported in WebGL');
            }
        }
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
        context.bindVertexArray(null);
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 2);
        statistics.increment('rendered-instances', this.descriptor.instanceCount);
    }
}
