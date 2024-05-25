import { statistics } from '../..';
import { GlShader } from '../webgl/gl-shader';

export class Gl2Shader extends GlShader {
    private uniformBlockIndices = new Map<string, number>();
    protected context!: WebGL2RenderingContext;

    protected override getShaderHeader(): string {
        return '#version 300 es\n';
    }

    protected override setAttributeLocations(): void {}

    public getUniformBlockIndex(name: string): number {
        let index = this.uniformBlockIndices.get(name);
        if (index == null) {
            index = this.context.getUniformBlockIndex(this.program, name);
            statistics.increment('api-calls', 1);
            if (DEVELOPMENT) {
                if (index === this.context.INVALID_INDEX) {
                    throw new Error(`Couldn't find uniform block '${name}'`);
                }
            }
            this.uniformBlockIndices.set(name, index);
        }
        return index;
    }
}
