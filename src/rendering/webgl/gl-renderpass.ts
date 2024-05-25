import { vec2, vec3, vec4, mat2, mat3, mat4 } from 'gl-matrix';

import { Command } from '../command';
import { Pipeline } from '../pipeline';
import {
    DrawInstancedIndexedCommandDescriptor,
    OffscreenRenderpassDescriptor,
    Renderpass,
    RenderpassDescriptor,
    SetIndexedUniformCommandDescriptor,
    SetDrawConfigCommandDescriptor,
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
    GlSetUniformTextureCommand,
} from './gl-command';
import { GlTimeQuery } from './gl-time-query';
import { rendering, statistics } from '../..';
import { Texture } from '../texture';
import { Buffer } from '../buffer';
import { getGlContext, getGlContextWrapper } from './gl-rendering-context';
import { getRenderingCapabilities } from '../rendering-context';

export abstract class GlRenderpass implements Renderpass {
    protected context = getGlContext();
    protected contextWrapper = getGlContextWrapper();
    protected commands: Command[] = [];
    protected descriptor: RenderpassDescriptor;
    private query?: GlTimeQuery;
    protected pipeline?: Pipeline;
    protected fbo: WebGLFramebuffer | null = null;

    public constructor(descriptor: RenderpassDescriptor) {
        this.descriptor = descriptor;
        this.query = descriptor.query as GlTimeQuery;
        if (this.descriptor.type === 'offscreen') {
            this.createFbo(this.descriptor);
        }
    }

    private createFbo(descriptor: OffscreenRenderpassDescriptor): void {
        this.fbo = this.context.createFramebuffer();
        this.context.bindFramebuffer(this.context.FRAMEBUFFER, this.fbo);
        statistics.increment('api-calls', 2);
        this.addColorAttachments(descriptor);
        this.addDepthAttachment();
        if (DEVELOPMENT) {
            const status = this.context.checkFramebufferStatus(this.context.FRAMEBUFFER);
            statistics.increment('api-calls', 1);
            if (status !== this.context.FRAMEBUFFER_COMPLETE) {
                const error = `FBO error status: ${this.fboStatusToString(status)}`;
                throw new Error(error);
            }
        }
    }

    private addColorAttachments(descriptor: OffscreenRenderpassDescriptor): void {
        for (let i = 0; i < descriptor.colorAttachments.length; i++) {
            const colorAttachment = descriptor.colorAttachments[i];
            this.context.framebufferTexture2D(
                this.context.FRAMEBUFFER,
                this.context.COLOR_ATTACHMENT0 + i,
                this.context.TEXTURE_2D,
                colorAttachment.texture.getId(),
                0
            );
        }
        statistics.increment('api-calls', descriptor.colorAttachments.length);
    }

    private addDepthAttachment(): void {
        if (this.descriptor.depthStencilAttachment) {
            this.context.framebufferTexture2D(
                this.context.FRAMEBUFFER,
                this.context.DEPTH_ATTACHMENT,
                this.context.TEXTURE_2D,
                this.descriptor.depthStencilAttachment.texture.getId(),
                0
            );
            statistics.increment('api-calls', 1);
        }
    }

    protected abstract fboStatusToString(status: GLenum): string;

    public setPipelineCommand(pipeline: Pipeline): void {
        this.pipeline = pipeline;
        this.commands.push(new GlSetPipelneCommand(pipeline));
    }

    public abstract setVertexBufferCommand(descriptor: SetVertexBufferCommandDescriptor): void;

    public abstract setDrawConfigCommand(descriptor: SetDrawConfigCommandDescriptor): void;

    public setIndexBufferCommand(indexBuffer: GlBuffer): void {
        this.commands.push(new GlSetIndexBufferCommand(indexBuffer));
    }

    public abstract setUniformBufferCommand(descriptor: SetIndexedUniformCommandDescriptor<Buffer>): void;

    public setUniformFloatCommand(descriptor: SetUniformCommandDescriptor<number>): void {
        const shader = this.pipeline!.getShader();
        this.commands.push(new GlSetUniformFloatCommand(descriptor, shader));
    }

    public setUniformVec2Command(descriptor: SetUniformCommandDescriptor<vec2>): void {
        const shader = this.pipeline!.getShader();
        this.commands.push(new GlSetUniformVec2Command(descriptor, shader));
    }

    public setUniformVec3Command(descriptor: SetUniformCommandDescriptor<vec3>): void {
        const shader = this.pipeline!.getShader();
        this.commands.push(new GlSetUniformVec3Command(descriptor, shader));
    }

    public setUniformVec4Command(descriptor: SetUniformCommandDescriptor<vec4>): void {
        const shader = this.pipeline!.getShader();
        this.commands.push(new GlSetUniformVec4Command(descriptor, shader));
    }

    public setUniformMat2Command(descriptor: SetUniformCommandDescriptor<mat2>): void {
        const shader = this.pipeline!.getShader();
        this.commands.push(new GlSetUniformMat2Command(descriptor, shader));
    }

    public setUniformMat3Command(descriptor: SetUniformCommandDescriptor<mat3>): void {
        const shader = this.pipeline!.getShader();
        this.commands.push(new GlSetUniformMat3Command(descriptor, shader));
    }

    public setUniformMat4Command(descriptor: SetUniformCommandDescriptor<mat4>): void {
        const shader = this.pipeline!.getShader();
        this.commands.push(new GlSetUniformMat4Command(descriptor, shader));
    }

    public setUniformTextureCommand(descriptor: SetIndexedUniformCommandDescriptor<Texture>): void {
        const shader = this.pipeline!.getShader();
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
        this.configureFbo();
        if (getRenderingCapabilities().gpuTimer) {
            this.query?.begin();
        }
        for (const command of this.commands) {
            command.execute();
        }
        this.unbundVao();
        this.commands.length = 0;
        if (getRenderingCapabilities().gpuTimer) {
            this.query?.end();
            this.query?.update();
        }
    }

    protected abstract unbundVao(): void;

    private configureFbo(): void {
        const canvas = rendering.getCanvas();
        this.context.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        if (this.descriptor.depthStencilAttachment) {
            this.context.enable(this.context.DEPTH_TEST);
        } else {
            this.context.disable(this.context.DEPTH_TEST);
        }
        statistics.increment('api-calls', 2);
        if (this.descriptor.type === 'canvas') {
            this.context.bindFramebuffer(this.context.FRAMEBUFFER, null);
            statistics.increment('api-calls', 1);
        } else {
            this.context.bindFramebuffer(this.context.FRAMEBUFFER, this.fbo);
            statistics.increment('api-calls', 1);
            this.configureColorAttachments(this.descriptor);
            this.configureDepthAttachment();
        }
    }

    private configureColorAttachments(descriptor: OffscreenRenderpassDescriptor): void {
        for (let i = 0; i < descriptor.colorAttachments.length; i++) {
            const colorAttachment = descriptor.colorAttachments[i];
            if (colorAttachment.clearColor) {
                const color = colorAttachment.clearColor;
                this.clearColor(i, color);
            }
        }
    }

    protected abstract clearColor(index: number, color: number[]): void;

    private configureDepthAttachment(): void {
        if (this.descriptor.depthStencilAttachment?.clearValue) {
            this.context.clearDepth(this.descriptor.depthStencilAttachment.clearValue);
            this.context.clear(this.context.DEPTH_BUFFER_BIT);
            statistics.increment('api-calls', 2);
        }
    }

    public release(): void {
        if (this.fbo) {
            this.context.deleteFramebuffer(this.fbo);
            statistics.increment('api-calls', 1);
            this.fbo = null;
        }
    }
}
