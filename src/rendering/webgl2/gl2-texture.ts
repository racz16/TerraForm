import { getGl2Context } from '../rendering-context';
import { Texture2dDescriptor } from '../texture';
import { GlTexture } from '../webgl/gl-texture';

export class Gl2Texture extends GlTexture {
    protected context: WebGL2RenderingContext;

    public constructor(descriptor: Texture2dDescriptor) {
        super(descriptor);
        this.context = getGl2Context().getId();
    }

    protected override getInternalFormat(descriptor: Texture2dDescriptor): GLint {
        switch (descriptor.format) {
            case 'rgba8':
                return this.context.RGBA8;
            case 'depth':
                return this.context.DEPTH_COMPONENT32F;
        }
    }

    protected override getType(descriptor: Texture2dDescriptor): GLenum {
        switch (descriptor.format) {
            case 'rgba8':
                return this.context.UNSIGNED_BYTE;
            case 'depth':
                return this.context.FLOAT;
        }
    }
}
