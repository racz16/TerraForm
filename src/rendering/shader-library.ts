import lambertianVertexCode from '../shader/lambertian.vert';
import lambertianFragmentCode from '../shader/lambertian.frag';
import quadVertexCode from '../shader/quad.vert';
import quadFragmentCode from '../shader/quad.frag';
import lambertianCode from '../shader/lambertian.wgsl';
import quadCode from '../shader/quad.wgsl';

export class ShaderLibrary {
    private static shaders = new Map<string, string>();

    static {
        ShaderLibrary.shaders.set('gl-vertex-lambertian', lambertianVertexCode);
        ShaderLibrary.shaders.set('gl-fragment-lambertian', lambertianFragmentCode);
        ShaderLibrary.shaders.set('gl-vertex-quad', quadVertexCode);
        ShaderLibrary.shaders.set('gl-fragment-quad', quadFragmentCode);
        ShaderLibrary.shaders.set('gpu-lambertian', lambertianCode);
        ShaderLibrary.shaders.set('gpu-quad', quadCode);
    }

    public static get(name: string): string {
        const result = ShaderLibrary.shaders.get(name);
        if (!result) {
            throw new Error(`Couldn't find shader ${name}`);
        }
        return result;
    }
}
