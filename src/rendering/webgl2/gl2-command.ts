import { statistics } from '../..';
import { Command } from '../command';
import {
    DrawInstancedIndexedCommandDescriptor,
    SetIndexedUniformCommandDescriptor,
    SetDrawConfigCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../renderpass';
import { Shader } from '../shader';
import { Gl2Shader } from './gl2-shader';
import { Buffer } from '../buffer';
import { getGl2ContextWrapper, getGl2Context } from './gl2-rendering-context';

export class Gl2SetVertexBufferCommand implements Command {
    private descriptor: SetVertexBufferCommandDescriptor;

    public constructor(descriptor: SetVertexBufferCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        getGl2ContextWrapper().configVbo(this.descriptor);
    }
}

export class Gl2SetDrawConfigCommand implements Command {
    private descriptor: SetDrawConfigCommandDescriptor;

    public constructor(descriptor: SetDrawConfigCommandDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        const drawConfig = this.descriptor.drawConfig;
        getGl2Context().bindVertexArray(drawConfig.getId());
        statistics.increment('api-calls', 1);
    }
}

export class Gl2SetUniformBufferCommand implements Command {
    protected context = getGl2Context();
    private descriptor: SetIndexedUniformCommandDescriptor<Buffer>;
    private shader: Shader;

    public constructor(descriptor: SetIndexedUniformCommandDescriptor<Buffer>, shader: Shader) {
        this.descriptor = descriptor;
        this.shader = shader;
    }

    public execute(): void {
        const uniformBuffer = this.descriptor.value;
        const shader = this.shader as Gl2Shader;
        const index = shader.getUniformBlockIndex(this.descriptor.name);
        this.context.uniformBlockBinding(shader.getId(), index, this.descriptor.index);
        this.context.bindBufferBase(this.context.UNIFORM_BUFFER, this.descriptor.index, uniformBuffer.getId());
        statistics.increment('api-calls', 2);
    }
}

export class Gl2DrawInstancedIndexedCommand implements Command {
    protected context = getGl2Context();
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
        this.context.drawElementsInstanced(
            this.context.TRIANGLES,
            this.descriptor.indexCount,
            this.context.UNSIGNED_SHORT,
            0,
            this.descriptor.instanceCount
        );
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', this.descriptor.instanceCount);
    }
}
