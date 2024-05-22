import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

import { Command } from '../command';
import { isWebGL2 } from '../rendering';
import { GlBuffer } from './gl-buffer';
import { Pipeline } from '../pipeline';
import { statistics } from '../..';
import { GlShader } from './gl-shader';
import { getGl1Context, getGl2Context } from '../rendering-context';
import { SetIndexedUniformCommandDescriptor, SetUniformCommandDescriptor } from '../renderpass';
import { Texture } from '../texture';
import { Shader } from '../shader';

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
        const context = isWebGL2() ? getGl2Context() : getGl1Context();
        context.configEbo(this.indexBuffer);
    }
}

abstract class GlSetUniformCommand<T> implements Command {
    protected descriptor: SetUniformCommandDescriptor<T>;
    private shader: GlShader;

    public constructor(descriptor: SetUniformCommandDescriptor<T>, shader: Shader) {
        this.descriptor = descriptor;
        this.shader = shader as GlShader;
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

    public constructor(descriptor: SetIndexedUniformCommandDescriptor<Texture>, shader: Shader) {
        super(descriptor, shader);
        this.textureUnit = descriptor.index;
    }

    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.activeTexture(context.TEXTURE0 + this.textureUnit);
        const texture = this.descriptor.value;
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
