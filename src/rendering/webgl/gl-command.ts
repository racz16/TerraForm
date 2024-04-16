import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

import { Command } from '../command';
import { isWebGL1, isWebGL2 } from '../rendering';
import { GlBuffer } from './gl-buffer';
import { Pipeline } from '../pipeline';
import { statistics } from '../..';
import { GlShader } from './gl-shader';
import { getGl1Context, getGl2Context } from '../rendering-context';
import { RenderpassDescriptor, SetIndexedUniformCommandDescriptor, SetUniformCommandDescriptor } from '../renderpass';
import { Texture } from '../texture';
import { GlTexture } from './gl-texture';

export class GlStartRenderpassCommand implements Command {
    private descriptor: RenderpassDescriptor;

    public constructor(descriptor: RenderpassDescriptor) {
        this.descriptor = descriptor;
    }

    public execute(): void {
        const context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        context.viewport(0, 0, window.innerWidth, window.innerHeight);
        statistics.increment('api-calls', 1);
        if (this.descriptor.type === 'canvas') {
            context.bindFramebuffer(context.FRAMEBUFFER, null);
            statistics.increment('api-calls', 1);
        } else {
            const fbo = context.createFramebuffer();
            context.bindFramebuffer(context.FRAMEBUFFER, fbo);
            for (let i = 0; i < this.descriptor.colorAttachments.length; i++) {
                const colorAttachment = this.descriptor.colorAttachments[i];
                context.framebufferTexture2D(
                    context.FRAMEBUFFER,
                    context.COLOR_ATTACHMENT0 + i,
                    context.TEXTURE_2D,
                    colorAttachment.texture.getId(),
                    0
                );
                statistics.increment('api-calls', 1);
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
            if (this.descriptor.depthStencilAttachment) {
                context.framebufferTexture2D(
                    context.FRAMEBUFFER,
                    context.DEPTH_ATTACHMENT,
                    context.TEXTURE_2D,
                    this.descriptor.depthStencilAttachment.texture.getId(),
                    0
                );
                statistics.increment('api-calls', 1);
                if (this.descriptor.depthStencilAttachment.clearValue) {
                    context.clearDepth(this.descriptor.depthStencilAttachment.clearValue);
                    context.clear(context.DEPTH_BUFFER_BIT);
                    statistics.increment('api-calls', 2);
                }
            }
            if (this.descriptor.depthStencilAttachment) {
                context.enable(context.DEPTH_TEST);
            } else {
                context.disable(context.DEPTH_TEST);
            }
            statistics.increment('api-calls', 3);
            // TODO: release FBO
            // context.deleteFramebuffer(fbo);
        }
    }
}

export class GlSetPipelneCommand implements Command {
    private pipeline: Pipeline;

    public constructor(pipeline: Pipeline) {
        this.pipeline = pipeline;
    }

    public execute(): void {
        const context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        context.useProgram(this.pipeline.getDescriptor().shader.getId());
        statistics.increment('api-calls', 1);
    }
}

export class GlSetIndexBufferCommand implements Command {
    private indexBuffer: GlBuffer;

    public constructor(indexBuffer: GlBuffer) {
        this.indexBuffer = indexBuffer;
    }

    public execute(): void {
        const context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, this.indexBuffer.getId());
        statistics.increment('api-calls', 1);
    }
}

abstract class GlSetUniformCommand<T> implements Command {
    protected descriptor: SetUniformCommandDescriptor<T>;
    private shader: GlShader;

    public constructor(descriptor: SetUniformCommandDescriptor<T>, shader: GlShader) {
        this.descriptor = descriptor;
        this.shader = shader;
    }

    public execute(): void {
        const context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        const location = this.shader.getUniformLocation(this.descriptor.name);
        this.setUniform(context, location);
    }

    protected abstract setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void;
}

export class GlSetUniformFloatCommand extends GlSetUniformCommand<number> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniform1f(location, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformVec2Command extends GlSetUniformCommand<vec2> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniform2fv(location, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformVec3Command extends GlSetUniformCommand<vec3> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniform3fv(location, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformVec4Command extends GlSetUniformCommand<vec4> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniform4fv(location, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformMat2Command extends GlSetUniformCommand<mat2> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniformMatrix2fv(location, false, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformMat3Command extends GlSetUniformCommand<mat3> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniformMatrix3fv(location, false, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformMat4Command extends GlSetUniformCommand<mat4> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniformMatrix4fv(location, false, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformTextureCommand extends GlSetUniformCommand<Texture> {
    private textureUnit: number;

    public constructor(descriptor: SetIndexedUniformCommandDescriptor<Texture>, shader: GlShader) {
        super(descriptor, shader);
        this.textureUnit = descriptor.index;
    }

    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.activeTexture(context.TEXTURE0 + this.textureUnit);
        const texture = this.descriptor.value as GlTexture;
        context.bindTexture(context.TEXTURE_2D, texture.getId());
        context.uniform1i(location, this.textureUnit);
        statistics.increment('api-calls', 3);
    }
}

export class GlDrawIndexedCommand implements Command {
    private indexCount: number;

    public constructor(indexCount: number) {
        this.indexCount = indexCount;
    }

    public execute(): void {
        const context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        context.drawElements(context.TRIANGLES, this.indexCount, context.UNSIGNED_SHORT, 0);
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', 1);
    }
}
