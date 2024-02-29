import { statistics } from '../..';
import { getGl2Context } from '../rendering-context';
import { GlShader } from '../webgl/gl-shader';

export class Gl2Shader extends GlShader {
    private uniformBlockIndices = new Map<string, number>();

    protected override getShaderHeader(): string {
        return '#version 300 es\n';
    }

    protected override setAttributeLocations(): void {}

    public getUniformBlockIndex(name: string): number {
        const context = getGl2Context().getId();
        let index = this.uniformBlockIndices.get(name);
        if (index == null) {
            index = context.getUniformBlockIndex(this.program, name);
            statistics.increment('api-calls', 1);
            if (DEVELOPMENT) {
                if (index === context.INVALID_INDEX) {
                    throw new Error(`Couldn't find uniform block '${name}'`);
                }
            }
            this.uniformBlockIndices.set(name, index);
        }
        return index;
    }
}
