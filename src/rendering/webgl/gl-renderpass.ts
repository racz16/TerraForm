import { vec2, vec3, vec4, mat2, mat3, mat4 } from 'gl-matrix';
import { Command } from '../command';
import { Pipeline } from '../pipeline';
import {
    DrawInstancedIndexedCommandDescriptor,
    Renderpass,
    RenderpassDescriptor,
    SetIndexedUniformCommandDescriptor,
    SetUniformCommandDescriptor,
    SetVertexBufferCommandDescriptor,
} from '../renderpass';
import { GlBuffer } from './gl-buffer';
import {
    GlSetPipelneCommand,
    GlSetIndexBufferCommand,
    GlSetUniformFloatCommand,
    GlSetUniformVec2Command,
    GlSetUniformVec3Command,
    GlSetUniformVec4Command,
    GlSetUniformMat2Command,
    GlSetUniformMat3Command,
    GlSetUniformMat4Command,
    GlDrawIndexedCommand,
    GlStartRenderpassCommand,
    GlSetUniformTextureCommand,
} from './gl-command';
import { GlShader } from './gl-shader';
import { GlTimeQuery } from './gl-time-query';
import { rendering } from '../..';
import { Texture } from '../texture';
import { Buffer } from '../buffer';

export abstract class GlRenderpass implements Renderpass {
    protected commands: Command[] = [];
    private query?: GlTimeQuery;
    protected pipeline?: Pipeline;

    public constructor(descriptor: RenderpassDescriptor) {
        this.query = descriptor.query as GlTimeQuery;
        this.commands.push(new GlStartRenderpassCommand(descriptor));
    }

    public setPipelineCommand(pipeline: Pipeline): void {
        this.pipeline = pipeline;
        this.commands.push(new GlSetPipelneCommand(pipeline));
    }

    public abstract setVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void;

    public setIndexBufferCommand(indexBuffer: GlBuffer): void {
        this.commands.push(new GlSetIndexBufferCommand(indexBuffer));
    }

    public abstract setUniformBufferCommand(descriptor: SetIndexedUniformCommandDescriptor<Buffer>): void;

    public setUniformFloatCommand(descriptor: SetUniformCommandDescriptor<number>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformFloatCommand(descriptor, shader));
    }

    public setUniformVec2Command(descriptor: SetUniformCommandDescriptor<vec2>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformVec2Command(descriptor, shader));
    }

    public setUniformVec3Command(descriptor: SetUniformCommandDescriptor<vec3>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformVec3Command(descriptor, shader));
    }

    public setUniformVec4Command(descriptor: SetUniformCommandDescriptor<vec4>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformVec4Command(descriptor, shader));
    }

    public setUniformMat2Command(descriptor: SetUniformCommandDescriptor<mat2>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformMat2Command(descriptor, shader));
    }

    public setUniformMat3Command(descriptor: SetUniformCommandDescriptor<mat3>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformMat3Command(descriptor, shader));
    }

    public setUniformMat4Command(descriptor: SetUniformCommandDescriptor<mat4>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformMat4Command(descriptor, shader));
    }

    public setUniformTextureCommand(descriptor: SetIndexedUniformCommandDescriptor<Texture>): void {
        const shader = this.pipeline!.getDescriptor().shader as GlShader;
        this.commands.push(new GlSetUniformTextureCommand(descriptor, shader));
    }

    public drawIndexedCommand(indexCount: number): void {
        this.commands.push(new GlDrawIndexedCommand(indexCount));
    }

    public abstract drawInstancedIndexedCommand(descriptor: DrawInstancedIndexedCommandDescriptor): void;

    public pushDebugGroupCommand(): void {
        throw new Error('Debug groups are not supported in WebGL');
    }

    public popDebugGroupCommand(): void {
        throw new Error('Debug groups are not supported in WebGL');
    }

    public addDebugLabelCommand(): void {
        throw new Error('Debug labels are not supported in WebGL');
    }

    public execute(): void {
        if (rendering.getCapabilities().gpuTimer) {
            this.query?.begin();
        }
        for (const command of this.commands) {
            command.execute();
        }
        if (rendering.getCapabilities().gpuTimer) {
            this.query?.end();
            this.query?.update();
        }
    }
}
