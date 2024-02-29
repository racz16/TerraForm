import { statistics } from '../..';
import { getGl1Context } from '../rendering-context';
import { GlShader } from '../webgl/gl-shader';

export class Gl1Shader extends GlShader {
    protected override getShaderHeader(): string {
        return '';
    }

    protected override setAttributeLocations(): void {
        const context = getGl1Context().getId();
        context.bindAttribLocation(this.program, 0, 'vertexPosition');
        context.bindAttribLocation(this.program, 1, 'vertexNormal');
        context.bindAttribLocation(this.program, 2, 'M');
        context.bindAttribLocation(this.program, 6, 'color');
        statistics.increment('api-calls', 4);
    }
}
