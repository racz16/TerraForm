import { Mesh, VertexBufferDescriptor } from './mesh';
import { isWebGL1, isWebGL2 } from './rendering';
import { Gl1DrawConfig } from './webgl1/gl1-draw-config';
import { Gl2DrawConfig } from './webgl2/gl2-draw-config';
import { GpuDrawConfig } from './webgpu/gpu-draw-config';

export interface DrawConfig {
    getId(): any;
    getMesh(): Mesh;
    getInstanceData(): VertexBufferDescriptor | undefined;
    release(): void;
}

export interface DrawConfigDescriptor {
    mesh: Mesh;
    instanceData?: VertexBufferDescriptor;
}

export function createDrawConfig(descriptor: DrawConfigDescriptor): DrawConfig {
    if (isWebGL1()) {
        return new Gl1DrawConfig(descriptor);
    } else if (isWebGL2()) {
        return new Gl2DrawConfig(descriptor);
    } else {
        return new GpuDrawConfig(descriptor);
    }
}
