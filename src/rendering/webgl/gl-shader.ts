import { Shader, ShaderDescriptor } from '../shader';
import { isWebGL2 } from '../rendering';
import { statistics } from '../..';
import { getGl1Context, getGl2Context } from '../rendering-context';
import { ShaderLibrary } from '../shader-library';
import { VertexBufferLayout } from '../pipeline';
import { numberSource } from '../../utility';

export abstract class GlShader implements Shader {
    protected program: WebGLProgram;
    private uniformLocations = new Map<string, WebGLUniformLocation>();
    private context: WebGLRenderingContext | WebGL2RenderingContext;
    private name: string;
    private valid = true;

    public constructor(descriptor: ShaderDescriptor) {
        this.context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        this.name = descriptor.name;
        const vertexShader = this.getShader(this.context.VERTEX_SHADER, this.getVertexShaderSource());
        const fragmentShader = this.getShader(this.context.FRAGMENT_SHADER, this.getFragmentShaderSource());
        this.program = this.context.createProgram()!;
        this.setAttributeLocations(descriptor.vertexBufferLayouts);
        this.context.attachShader(this.program, vertexShader);
        this.context.attachShader(this.program, fragmentShader);
        this.context.linkProgram(this.program);
        if (DEVELOPMENT) {
            statistics.increment('api-calls', 2);
            if (!this.context.getProgramParameter(this.program, this.context.LINK_STATUS)) {
                const error = this.context.getProgramInfoLog(this.program);
                statistics.increment('api-calls', 1);
                this.throwError(descriptor.name, 'Shader program linking is invalid', error ?? '');
            }
            this.context.validateProgram(this.program);
            if (!this.context.getProgramParameter(this.program, this.context.VALIDATE_STATUS)) {
                const error = this.context.getProgramInfoLog(this.program);
                statistics.increment('api-calls', 1);
                this.throwError(descriptor.name, 'Shader program is invalid', error ?? '');
            }
        }
        this.context.deleteShader(vertexShader);
        this.context.deleteShader(fragmentShader);
        statistics.increment('api-calls', 6);
    }

    private getVertexShaderSource(): string {
        return ShaderLibrary.get(`gl-${this.name}-vertex`);
    }

    private getFragmentShaderSource(): string {
        return ShaderLibrary.get(`gl-${this.name}-fragment`);
    }

    protected abstract setAttributeLocations(vertexBufferLayouts: VertexBufferLayout[]): void;

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
                this.throwError(this.name, 'Shader is invalid', error ?? '', sourceCode);
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
                    this.throwError(this.name, `Couldn't find uniform '${name}'`, '');
                }
            }
            this.uniformLocations.set(name, location!);
        }
        return location!;
    }

    private throwError(name: string, errorType: string, errorMessage: string, source?: string): void {
        let result = `${errorType} "${name}"\n`;
        result += errorMessage + '\n';
        result += this.getSource(source);
        throw new Error(result);
    }

    private getSource(source?: string): string {
        if (source) {
            return numberSource(source);
        } else {
            const vertexSource = this.getVertexShaderSource();
            const fragmentSource = this.getFragmentShaderSource();
            return numberSource(vertexSource) + '\n\n' + numberSource(fragmentSource);
        }
    }

    public release(): void {
        if (this.valid) {
            this.context.deleteProgram(this.program);
            statistics.increment('api-calls', 1);
            this.valid = false;
        }
    }
}
