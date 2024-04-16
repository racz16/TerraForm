import { Texture2dDescriptor } from '../texture';
import { GlTexture } from '../webgl/gl-texture';

export class Gl1Texture extends GlTexture {
    protected override getInternalFormat(descriptor: Texture2dDescriptor): GLint {
        switch (descriptor.format) {
            case 'rgba8':
                return this.context.RGBA;
            case 'depth':
                return this.context.DEPTH_COMPONENT;
        }
    }

    protected override getType(descriptor: Texture2dDescriptor): GLenum {
        switch (descriptor.format) {
            case 'rgba8':
                return this.context.UNSIGNED_BYTE;
            case 'depth':
                return this.context.UNSIGNED_INT;
        }
    }
}
