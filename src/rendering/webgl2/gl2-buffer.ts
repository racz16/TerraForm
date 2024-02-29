import { BufferUsage, BufferDescriptor, BufferDataDescriptor } from '../buffer';
import { GlBuffer } from '../webgl/gl-buffer';
import { mathTypeToTypedArray } from '../../utility';
import { statistics } from '../..';

export class Gl2Buffer extends GlBuffer {
    protected context!: WebGL2RenderingContext;

    protected override allocate(descriptor: BufferDescriptor): void {
        const glUsage = descriptor.dynamic ? this.context.DYNAMIC_DRAW : this.context.STATIC_DRAW;
        if (descriptor.type === 'size') {
            this.size = descriptor.size;
            this.context.bufferData(this.target, descriptor.size, glUsage);
        } else {
            this.size = descriptor.dataLength ?? descriptor.data.byteLength;
            this.context.bufferData(this.target, descriptor.data, glUsage, descriptor.dataOffset ?? 0, descriptor.dataLength);
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
                return this.context.UNIFORM_BUFFER;
        }
    }

    public override setData(data: BufferDataDescriptor): void {
        if (data.type === 'math') {
            this.setData({ type: 'buffer', data: mathTypeToTypedArray(data.data), offset: data.offset });
        } else {
            this.bind();
            this.context.bufferSubData(this.target, data.offset ?? 0, data.data, data.dataOffset ?? 0, data.dataLength);
            statistics.increment('api-calls', 1);
        }
    }
}
