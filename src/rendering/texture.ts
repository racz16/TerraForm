import { isWebGL1, isWebGL2 } from './rendering';
import { Gl1Texture } from './webgl1/gl1-texture';
import { Gl2Texture } from './webgl2/gl2-texture';
import { GpuTexture } from './webgpu/gpu-texture';

export type ColorTextureFormat = 'rgba8';

export type DepthTextureFormat = 'depth';

export type TextureFormat = ColorTextureFormat | DepthTextureFormat;

export interface Texture2dDescriptor {
    type: '2d';
    width: number;
    height: number;
    format: TextureFormat;
    rendered?: boolean;
    sampled?: boolean;
    data?: ArrayBufferView;
    label?: string;
}

export interface Texture {
    getId(): any;
    release(): void;
}

export function createTexture(descriptor: Texture2dDescriptor): Texture {
    if (isWebGL1()) {
        return new Gl1Texture(descriptor);
    } else if (isWebGL2()) {
        return new Gl2Texture(descriptor);
    } else {
        return new GpuTexture(descriptor);
    }
}
