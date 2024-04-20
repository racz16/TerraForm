import { statistics } from '../..';
import { isWebGL2 } from '../rendering';
import { getGl2Context, getGl1Context } from '../rendering-context';
import { Texture, Texture2dDescriptor } from '../texture';

export abstract class GlTexture implements Texture {
    protected context: WebGLRenderingContext | WebGL2RenderingContext;
    protected id: WebGLBuffer;
    protected size = 0;

    public constructor(descriptor: Texture2dDescriptor) {
        this.context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        this.id = this.context.createTexture()!;
        this.context.bindTexture(this.context.TEXTURE_2D, this.id);
        this.context.texImage2D(
            this.context.TEXTURE_2D,
            0,
            this.getInternalFormat(descriptor),
            descriptor.width,
            descriptor.height,
            0,
            this.getFormat(descriptor),
            this.getType(descriptor),
            descriptor.data ?? null
        );
        this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.NEAREST);
        this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.NEAREST);
        this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_S, this.context.CLAMP_TO_EDGE);
        this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_T, this.context.CLAMP_TO_EDGE);
        this.size = descriptor.width * descriptor.height * 4;
        statistics.increment('texture-data', this.size);
        statistics.increment('api-calls', 7);
    }

    public getId(): WebGLTexture {
        return this.id;
    }

    private getFormat(descriptor: Texture2dDescriptor): GLenum {
        switch (descriptor.format) {
            case 'rgba8':
                return this.context.RGBA;
            case 'depth':
                return this.context.DEPTH_COMPONENT;
        }
    }

    protected abstract getInternalFormat(descriptor: Texture2dDescriptor): GLint;

    protected abstract getType(descriptor: Texture2dDescriptor): GLenum;

    public release(): void {
        this.context.deleteTexture(this.id);
        statistics.increment('texture-data', -this.size);
        statistics.increment('api-calls', 1);
    }
}
