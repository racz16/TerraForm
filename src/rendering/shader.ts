import { isWebGL1, isWebGL2 } from './rendering';
import { Gl1Shader } from './webgl1/gl1-shader';
import { Gl2Shader } from './webgl2/gl2-shader';
import { GpuShader } from './webgpu/gpu-shader';

export interface Shader {
    getId(): any;
    release(): void;
}

export interface ShaderDescriptor {
    name: string;
    label?: string;
}

export function createShader(descriptor: ShaderDescriptor): Shader {
    if (isWebGL1()) {
        return new Gl1Shader(descriptor);
    } else if (isWebGL2()) {
        return new Gl2Shader(descriptor);
    } else {
        return new GpuShader(descriptor);
    }
}
