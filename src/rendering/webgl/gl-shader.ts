import { Shader, ShaderDescriptor } from '../shader';
import { isWebGL2 } from '../rendering';
import { statistics } from '../..';
import { getGl1Context, getGl2Context } from '../rendering-context';
import { ShaderLibrary } from '../shader-library';

export abstract class GlShader implements Shader {
    protected program: WebGLProgram;
    private uniformLocations = new Map<string, WebGLUniformLocation>();
    private context: WebGLRenderingContext | WebGL2RenderingContext;
    private valid = true;

    public constructor(descriptor: ShaderDescriptor) {
        this.context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        const vertexShader = this.getShader(this.context.VERTEX_SHADER, ShaderLibrary.get(`gl-vertex-${descriptor.name}`));
        const fragmentShader = this.getShader(this.context.FRAGMENT_SHADER, ShaderLibrary.get(`gl-fragment-${descriptor.name}`));
        this.program = this.context.createProgram()!;
        this.setAttributeLocations();
        this.context.attachShader(this.program, vertexShader);
        this.context.attachShader(this.program, fragmentShader);
        this.context.linkProgram(this.program);
        if (DEVELOPMENT) {
            statistics.increment('api-calls', 2);
            if (!this.context.getProgramParameter(this.program, this.context.LINK_STATUS)) {
                const error = this.context.getProgramInfoLog(this.program);
                statistics.increment('api-calls', 1);
                console.error(error);
                throw new Error('Shader program linking is invalid');
            }
            this.context.validateProgram(this.program);
            if (!this.context.getProgramParameter(this.program, this.context.VALIDATE_STATUS)) {
                const error = this.context.getProgramInfoLog(this.program);
                statistics.increment('api-calls', 1);
                console.error(error);
                throw new Error('Shader program is invalid');
            }
        }
        this.context.deleteShader(vertexShader);
        this.context.deleteShader(fragmentShader);
        statistics.increment('api-calls', 6);
    }

    protected abstract setAttributeLocations(): void;

    public getId(): WebGLProgram {
        return this.program;
    }

    private getShader(stage: GLenum, sourceCode: string): WebGLShader {
        const finalSourceCode = this.getShaderHeader() + sourceCode;
        const shader = this.context.createShader(stage)!;
        this.context.shaderSource(shader, finalSourceCode);
        this.context.compileShader(shader);
        statistics.increment('api-calls', 3);
        if (DEVELOPMENT) {
            statistics.increment('api-calls', 1);
            if (!this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {
                const error = this.context.getShaderInfoLog(shader);
                statistics.increment('api-calls', 1);
                console.error(finalSourceCode);
                console.error(error);
                throw new Error('Shader is invalid');
            }
        }
        return shader;
    }

    protected abstract getShaderHeader(): string;

    public getUniformLocation(name: string): WebGLUniformLocation {
        let location = this.uniformLocations.get(name);
        if (!location) {
            location = this.context.getUniformLocation(this.program, name) ?? undefined;
            statistics.increment('api-calls', 1);
            if (DEVELOPMENT) {
                if (!location) {
                    throw new Error(`Couldn't find uniform '${name}'`);
                }
            }
            this.uniformLocations.set(name, location!);
        }
        return location!;
    }

    public release(): void {
        if (this.valid) {
            this.context.deleteProgram(this.program);
            statistics.increment('api-calls', 1);
            this.valid = false;
        }
    }
}
