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
import { isWebGL2, isWebGL1 } from '../rendering';
import { getGl2Context, getGl1Context } from '../rendering-context';

export abstract class GlRenderpass implements Renderpass {
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
        const context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        this.fbo = context.createFramebuffer();
        context.bindFramebuffer(context.FRAMEBUFFER, this.fbo);
        statistics.increment('api-calls', 2);
        this.addColorAttachments(context, descriptor);
        this.addDepthAttachment(context);
        if (DEVELOPMENT) {
            const status = context.checkFramebufferStatus(context.FRAMEBUFFER);
            statistics.increment('api-calls', 1);
            if (status !== context.FRAMEBUFFER_COMPLETE) {
                const error = `FBO error status: ${this.fboStatusToString(status)}`;
                throw new Error(error);
            }
        }
    }

    private addColorAttachments(context: WebGLRenderingContext, descriptor: OffscreenRenderpassDescriptor): void {
        for (let i = 0; i < descriptor.colorAttachments.length; i++) {
            const colorAttachment = descriptor.colorAttachments[i];
            context.framebufferTexture2D(
                context.FRAMEBUFFER,
                context.COLOR_ATTACHMENT0 + i,
                context.TEXTURE_2D,
                colorAttachment.texture.getId(),
                0
            );
        }
        statistics.increment('api-calls', descriptor.colorAttachments.length);
    }

    private addDepthAttachment(context: WebGLRenderingContext): void {
        if (this.descriptor.depthStencilAttachment) {
            context.framebufferTexture2D(
                context.FRAMEBUFFER,
                context.DEPTH_ATTACHMENT,
                context.TEXTURE_2D,
                this.descriptor.depthStencilAttachment.texture.getId(),
                0
            );
            statistics.increment('api-calls', 1);
        }
    }

    private fboStatusToString(status: GLenum): string {
        if (isWebGL1()) {
            const context = getGl1Context().getId();
            return this.gl1FboStatusToString(context, status);
        } else {
            const context = getGl2Context().getId();
            if (status === context.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE) {
                return 'FRAMEBUFFER_INCOMPLETE_MULTISAMPLE';
            }
            return this.gl1FboStatusToString(context, status);
        }
    }

    private gl1FboStatusToString(context: WebGLRenderingContext, status: GLenum): string {
        switch (status) {
            case context.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
            case context.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
            case context.FRAMEBUFFER_UNSUPPORTED:
                return 'FRAMEBUFFER_UNSUPPORTED';
            default:
                return 'UNKNOWN FRAMEBUFFER STATUS';
        }
    }

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
        if (rendering.getCapabilities().gpuTimer) {
            this.query?.begin();
        }
        for (const command of this.commands) {
            command.execute();
        }
        this.unbundVao();
        this.commands.length = 0;
        if (rendering.getCapabilities().gpuTimer) {
            this.query?.end();
            this.query?.update();
        }
    }

    protected abstract unbundVao(): void;

    private configureFbo(): void {
        const context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        const canvas = rendering.getCanvas();
        context.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        if (this.descriptor.depthStencilAttachment) {
            context.enable(context.DEPTH_TEST);
        } else {
            context.disable(context.DEPTH_TEST);
        }
        statistics.increment('api-calls', 2);
        if (this.descriptor.type === 'canvas') {
            context.bindFramebuffer(context.FRAMEBUFFER, null);
            statistics.increment('api-calls', 1);
        } else {
            context.bindFramebuffer(context.FRAMEBUFFER, this.fbo);
            statistics.increment('api-calls', 1);
            this.configureColorAttachments(context, this.descriptor);
            this.configureDepthAttachment(context);
        }
    }

    private configureColorAttachments(context: WebGLRenderingContext, descriptor: OffscreenRenderpassDescriptor): void {
        for (let i = 0; i < descriptor.colorAttachments.length; i++) {
            const colorAttachment = descriptor.colorAttachments[i];
            if (colorAttachment.clearColor) {
                const color = colorAttachment.clearColor;
                if (isWebGL1()) {
                    context.clearColor(color[0], color[1], color[2], color[3]);
                    context.clear(context.COLOR_BUFFER_BIT);
                    statistics.increment('api-calls', 2);
                } else {
                    const gl2 = getGl2Context().getId();
                    gl2.clearBufferfv(gl2.COLOR, i, color);
                    statistics.increment('api-calls', 1);
                }
            }
        }
    }

    private configureDepthAttachment(context: WebGLRenderingContext): void {
        if (this.descriptor.depthStencilAttachment?.clearValue) {
            context.clearDepth(this.descriptor.depthStencilAttachment.clearValue);
            context.clear(context.DEPTH_BUFFER_BIT);
            statistics.increment('api-calls', 2);
        }
    }

    public release(): void {
        if (this.fbo) {
            const context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
            context.deleteFramebuffer(this.fbo);
            statistics.increment('api-calls', 1);
            this.fbo = null;
        }
    }
}
