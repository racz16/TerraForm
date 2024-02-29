import { statistics } from '../..';
import { Buffer, BufferUsage, BufferDescriptor, BufferDataDescriptor } from '../buffer';
import { isWebGL2 } from '../rendering';
import { getGl1Context, getGl2Context } from '../rendering-context';

export abstract class GlBuffer implements Buffer {
    protected context: WebGLRenderingContext | WebGL2RenderingContext;
    protected id: WebGLBuffer;
    protected size = 0;
    protected usage: BufferUsage;
    protected target: number;

    public constructor(descriptor: BufferDescriptor) {
        this.context = isWebGL2() ? getGl2Context().getId() : getGl1Context().getId();
        this.usage = descriptor.usage;
        this.target = this.getTarget();
        this.id = this.context.createBuffer()!;
        statistics.increment('api-calls', 1);
        this.bind();
        this.allocate(descriptor);
        statistics.increment('buffer-data', this.size);
    }

    public getId(): WebGLBuffer {
        return this.id;
    }

    protected abstract allocate(descriptor: BufferDescriptor): void;

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
        this.context.deleteBuffer(this.id);
        statistics.increment('api-calls', 1);
        statistics.increment('buffer-data', -this.size);
        this.size = 0;
    }
}
