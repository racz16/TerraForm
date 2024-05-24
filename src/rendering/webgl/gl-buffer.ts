import { statistics } from '../..';
import { Buffer, BufferUsage, BufferDescriptor, BufferDataDescriptor } from '../buffer';
import { isWebGL2 } from '../rendering';
import { getGl1Context, getGl2Context } from '../rendering-context';

export abstract class GlBuffer implements Buffer {
    protected context: WebGLRenderingContext | WebGL2RenderingContext;
    protected id: WebGLBuffer | null;
    protected size = 0;
    protected usage: BufferUsage;
    protected target: number;
    protected valid = true;

    public constructor(descriptor: BufferDescriptor) {
        this.context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        this.size = this.computeSize(descriptor);
        this.usage = descriptor.usage;
        this.target = this.getTarget();
        this.id = this.context.createBuffer();
        statistics.increment('api-calls', 1);
        this.bind();
        this.initializeBufferData(descriptor);
        statistics.increment('buffer-data', this.size);
    }

    private computeSize(descriptor: BufferDescriptor): number {
        if (descriptor.type === 'size' || descriptor.type === 'data-callback') {
            return descriptor.size;
        } else {
            return descriptor.dataLength ?? descriptor.data.byteLength;
        }
    }

    public getId(): WebGLBuffer | null {
        return this.id;
    }

    protected abstract initializeBufferData(descriptor: BufferDescriptor): void;

    protected abstract getTarget(): GLenum;

    protected bind(): void {
        this.context.bindBuffer(this.target, this.id);
        statistics.increment('api-calls', 1);
    }

    public getSize(): number {
        return this.size;
    }

    public getUsage(): BufferUsage {
        return this.usage;
    }

    public abstract setData(data: BufferDataDescriptor): void;

    public release(): void {
        if (this.valid) {
            this.context.deleteBuffer(this.id);
            statistics.increment('api-calls', 1);
            statistics.increment('buffer-data', -this.size);
            this.size = 0;
            this.valid = false;
        }
    }
}
