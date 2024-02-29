import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

import { Command } from '../command';
import {
    CommandBuffer,
    CommandBufferDescriptor,
    DrawInstancedIndexedCommandDescriptor,
    SetUniformBufferCommandDescriptor,
    SetUniformCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../command-buffer';
import { Pipeline } from '../pipeline';
import {
    GlDrawIndexedCommand,
    GlSetIndexBufferCommand,
    GlSetPipelneCommand,
    GlSetUniformFloatCommand,
    GlSetUniformMat2Command,
    GlSetUniformMat3Command,
    GlSetUniformMat4Command,
    GlSetUniformVec2Command,
    GlSetUniformVec3Command,
    GlSetUniformVec4Command,
} from '../webgl/gl-command';
import { GlBuffer } from './gl-buffer';
import { GlTimeQuery } from './gl-time-query';
import { GlShader } from './gl-shader';
import { rendering } from '../..';

export abstract class GlCommandBuffer implements CommandBuffer {
    protected commands: Command[] = [];
    private query?: GlTimeQuery;
    protected pipeline?: Pipeline;

    public constructor(descriptor: CommandBufferDescriptor) {
        this.query = descriptor.query as GlTimeQuery;
    }

    public addSetPipelineCommand(pipeline: Pipeline): void {
        this.pipeline = pipeline;
        this.commands.push(new GlSetPipelneCommand(pipeline));
    }

    public abstract addSetVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void;

    public addSetIndexBufferCommand(indexBuffer: GlBuffer): void {
        this.commands.push(new GlSetIndexBufferCommand(indexBuffer));
    }

    public abstract addSetUniformBufferCommand(descriptor: SetUniformBufferCommandDescriptor): void;

    public addSetUniformFloatCommand(descriptor: SetUniformCommandDescriptor<number>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformFloatCommand(descriptor, shader));
    }

    public addSetUniformVec2Command(descriptor: SetUniformCommandDescriptor<vec2>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformVec2Command(descriptor, shader));
    }

    public addSetUniformVec3Command(descriptor: SetUniformCommandDescriptor<vec3>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformVec3Command(descriptor, shader));
    }

    public addSetUniformVec4Command(descriptor: SetUniformCommandDescriptor<vec4>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformVec4Command(descriptor, shader));
    }

    public addSetUniformMat2Command(descriptor: SetUniformCommandDescriptor<mat2>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformMat2Command(descriptor, shader));
    }

    public addSetUniformMat3Command(descriptor: SetUniformCommandDescriptor<mat3>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformMat3Command(descriptor, shader));
    }

    public addSetUniformMat4Command(descriptor: SetUniformCommandDescriptor<mat4>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformMat4Command(descriptor, shader));
    }

    public addDrawIndexedCommand(indexCount: number): void {
        this.commands.push(new GlDrawIndexedCommand(indexCount));
    }

    public abstract addDrawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void;

    public addPushDebugGroup(): void {
        throw new Error('Debug groups are not supported in WebGL');
    }

    public addPopDebugGroup(): void {
        throw new Error('Debug groups are not supported in WebGL');
    }

    public addDebugLabel(): void {
        throw new Error('Debug labels are not supported in WebGL');
    }

    public execute(): void {
        if (rendering.getCapabilities().gpuTimer && this.query) {
            this.query.begin();
        }
        for (const command of this.commands) {
            command.execute();
        }
        if (rendering.getCapabilities().gpuTimer && this.query) {
            this.query.end();
        }
        if (rendering.getCapabilities().gpuTimer && this.query) {
            this.query.update();
        }
    }
}
