import { BufferUsage, BufferDescriptor, BufferDataDescriptor } from '../buffer';
import { GlBuffer } from '../webgl/gl-buffer';
import { mathTypeToTypedArray } from '../../utility';
import { statistics } from '../..';

export class Gl1Buffer extends GlBuffer {
    protected context!: WebGLRenderingContext;

    protected override allocate(descriptor: BufferDescriptor): void {
        const glUsage = descriptor.dynamic ? this.context.DYNAMIC_DRAW : this.context.STATIC_DRAW;
        if (descriptor.type === 'size') {
            this.size = descriptor.size;
            this.context.bufferData(this.target, descriptor.size, glUsage);
        } else {
            if (DEVELOPMENT) {
                if (descriptor.dataOffset || descriptor.dataLength) {
                    throw new Error('Data offset and data length are not supported in WebGL 1');
                }
            }
            this.size = descriptor.dataLength ?? descriptor.data.byteLength;
            this.context.bufferData(this.target, descriptor.data, glUsage);
        }
        statistics.increment('api-calls', 1);
    }

    protected override getTarget(): number {
        switch (this.usage) {
            case BufferUsage.VERTEX:
                return this.context.ARRAY_BUFFER;
            case BufferUsage.INDEX:
                return this.context.ELEMENT_ARRAY_BUFFER;
            case BufferUsage.UNIFORM:
                throw new Error('Uniform buffers are not supported in WebGL 1');
        }
    }

    public override setData(data: BufferDataDescriptor): void {
        if (data.type === 'math') {
            this.setData({ type: 'buffer', data: mathTypeToTypedArray(data.data), offset: data.offset });
        } else {
            if (DEVELOPMENT) {
                if (data.dataOffset || data.dataLength) {
                    throw new Error('Data offset and data length are not supported in WebGL 1');
                }
            }
            this.bind();
            this.context.bufferSubData(this.target, data.offset ?? 0, data.data);
            statistics.increment('api-calls', 1);
        }
    }
}
