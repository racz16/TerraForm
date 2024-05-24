import { statistics } from '../..';
import { VertexBufferLayout } from '../pipeline';
import { getGl1Context } from '../rendering-context';
import { GlShader } from '../webgl/gl-shader';

export class Gl1Shader extends GlShader {
    protected override getShaderHeader(): string {
        return '';
    }

    protected override setAttributeLocations(vertexBufferLayouts: VertexBufferLayout[]): void {
        const context = getGl1Context().getId();
        for (const layout of vertexBufferLayouts) {
            for (const attribute of layout.attributes) {
                if (attribute.name) {
                    context.bindAttribLocation(this.program, attribute.index, attribute.name);
                    statistics.increment('api-calls', 1);
                }
            }
        }
    }
}
