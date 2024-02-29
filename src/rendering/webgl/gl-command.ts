import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

import { Command } from '../command';
import { isWebGL2 } from '../rendering';
import { GlBuffer } from './gl-buffer';
import { Pipeline } from '../pipeline';
import { statistics } from '../..';
import { SetUniformCommandDescriptor } from '../command-buffer';
import { GlShader } from './gl-shader';
import { getGl1Context, getGl2Context } from '../rendering-context';

export class GlSetPipelneCommand implements Command {
    private pipeline: Pipeline;

    public constructor(pipeline: Pipeline) {
        this.pipeline = pipeline;
    }

    public execute(): void {
        const context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        context.useProgram(this.pipeline.getDescriptor().shader.getId());
        context.viewport(0, 0, window.innerWidth, window.innerHeight);
        context.clearColor(0.7, 0.8, 1, 1);
        context.clear(context.COLOR_BUFFER_BIT);
        statistics.increment('api-calls', 4);
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
        statistics.increment('api-calls', 1);
    }

    protected abstract setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void;
}

export class GlSetUniformFloatCommand extends GlSetUniformCommand<number> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniform1f(location, this.descriptor.value);
    }
}

export class GlSetUniformVec2Command extends GlSetUniformCommand<vec2> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniform2fv(location, this.descriptor.value);
    }
}

export class GlSetUniformVec3Command extends GlSetUniformCommand<vec3> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniform3fv(location, this.descriptor.value);
    }
}

export class GlSetUniformVec4Command extends GlSetUniformCommand<vec4> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniform4fv(location, this.descriptor.value);
    }
}

export class GlSetUniformMat2Command extends GlSetUniformCommand<mat2> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniformMatrix2fv(location, false, this.descriptor.value);
    }
}

export class GlSetUniformMat3Command extends GlSetUniformCommand<mat3> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniformMatrix3fv(location, false, this.descriptor.value);
    }
}

export class GlSetUniformMat4Command extends GlSetUniformCommand<mat4> {
    protected override setUniform(context: WebGL2RenderingContext | WebGLRenderingContext, location: WebGLUniformLocation): void {
        context.uniformMatrix4fv(location, false, this.descriptor.value);
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
