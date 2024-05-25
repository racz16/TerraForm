import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

import { Command } from '../command';
import { GlBuffer } from './gl-buffer';
import { Pipeline } from '../pipeline';
import { statistics } from '../..';
import { GlShader } from './gl-shader';
import { SetIndexedUniformCommandDescriptor, SetUniformCommandDescriptor } from '../renderpass';
import { Texture } from '../texture';
import { Shader } from '../shader';
import { getGlContext, getGlContextWrapper } from './gl-rendering-context';

export class GlSetPipelneCommand implements Command {
    protected context = getGlContext();
    private pipeline: Pipeline;

    public constructor(pipeline: Pipeline) {
        this.pipeline = pipeline;
    }

    public execute(): void {
        this.context.useProgram(this.pipeline.getShader().getId());
        statistics.increment('api-calls', 1);
    }
}

export class GlSetIndexBufferCommand implements Command {
    protected contextWrapper = getGlContextWrapper();
    private indexBuffer: GlBuffer;

    public constructor(indexBuffer: GlBuffer) {
        this.indexBuffer = indexBuffer;
    }

    public execute(): void {
        this.contextWrapper.configEbo(this.indexBuffer);
    }
}

abstract class GlSetUniformCommand<T> implements Command {
    protected context = getGlContext();
    protected descriptor: SetUniformCommandDescriptor<T>;
    private shader: GlShader;

    public constructor(descriptor: SetUniformCommandDescriptor<T>, shader: Shader) {
        this.descriptor = descriptor;
        this.shader = shader as GlShader;
    }

    public execute(): void {
        const location = this.shader.getUniformLocation(this.descriptor.name);
        this.setUniform(location);
    }

    protected abstract setUniform(location: WebGLUniformLocation): void;
}

export class GlSetUniformFloatCommand extends GlSetUniformCommand<number> {
    protected override setUniform(location: WebGLUniformLocation): void {
        this.context.uniform1f(location, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformVec2Command extends GlSetUniformCommand<vec2> {
    protected override setUniform(location: WebGLUniformLocation): void {
        this.context.uniform2fv(location, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformVec3Command extends GlSetUniformCommand<vec3> {
    protected override setUniform(location: WebGLUniformLocation): void {
        this.context.uniform3fv(location, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformVec4Command extends GlSetUniformCommand<vec4> {
    protected override setUniform(location: WebGLUniformLocation): void {
        this.context.uniform4fv(location, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformMat2Command extends GlSetUniformCommand<mat2> {
    protected override setUniform(location: WebGLUniformLocation): void {
        this.context.uniformMatrix2fv(location, false, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformMat3Command extends GlSetUniformCommand<mat3> {
    protected override setUniform(location: WebGLUniformLocation): void {
        this.context.uniformMatrix3fv(location, false, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformMat4Command extends GlSetUniformCommand<mat4> {
    protected override setUniform(location: WebGLUniformLocation): void {
        this.context.uniformMatrix4fv(location, false, this.descriptor.value);
        statistics.increment('api-calls', 1);
    }
}

export class GlSetUniformTextureCommand extends GlSetUniformCommand<Texture> {
    private textureUnit: number;

    public constructor(descriptor: SetIndexedUniformCommandDescriptor<Texture>, shader: Shader) {
        super(descriptor, shader);
        this.textureUnit = descriptor.index;
    }

    protected override setUniform(location: WebGLUniformLocation): void {
        this.context.activeTexture(this.context.TEXTURE0 + this.textureUnit);
        const texture = this.descriptor.value;
        this.context.bindTexture(this.context.TEXTURE_2D, texture.getId());
        this.context.uniform1i(location, this.textureUnit);
        statistics.increment('api-calls', 3);
    }
}

export class GlDrawIndexedCommand implements Command {
    protected context = getGlContext();
    private indexCount: number;

    public constructor(indexCount: number) {
        this.indexCount = indexCount;
    }

    public execute(): void {
        this.context.drawElements(this.context.TRIANGLES, this.indexCount, this.context.UNSIGNED_SHORT, 0);
        statistics.increment('draw-calls', 1);
        statistics.increment('api-calls', 1);
        statistics.increment('rendered-instances', 1);
    }
}
