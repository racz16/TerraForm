import { statistics } from '../..';
import { SIZEOF_LONG } from '../../constants';
import { nanoSecondsToMilliseconds } from '../../utility';
import { TimeQuery, TimeQueryDescriptor, TimeQueryHandler } from '../time-query';
import { getGpuDevice } from './gpu-rendering-context';

export class GpuTimeQuery implements TimeQuery {
    private static readonly TIMESTAMP_COUNT = 2;

    protected device = getGpuDevice();
    private querySet: GPUQuerySet;
    private resolveQueryBufer: GPUBuffer;
    private resultQueryBuffer: GPUBuffer;
    private handler: TimeQueryHandler;
    private valid = true;

    public constructor(descriptor: TimeQueryDescriptor) {
        this.querySet = this.device.createQuerySet({ label: descriptor.label, count: GpuTimeQuery.TIMESTAMP_COUNT, type: 'timestamp' });
        this.resolveQueryBufer = this.device.createBuffer({
            label: 'resolve query buffer',
            size: SIZEOF_LONG * GpuTimeQuery.TIMESTAMP_COUNT,
            usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });
        this.resultQueryBuffer = this.device.createBuffer({
            label: 'result query buffer',
            size: SIZEOF_LONG * GpuTimeQuery.TIMESTAMP_COUNT,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
        statistics.increment('api-calls', 3);
        statistics.increment('buffer-data', 2 * SIZEOF_LONG * GpuTimeQuery.TIMESTAMP_COUNT);
        this.handler = descriptor.handler;
    }

    public getId(): GPUQuerySet {
        return this.querySet;
    }

    public resolve(commandEncoder: GPUCommandEncoder): void {
        commandEncoder.resolveQuerySet(this.querySet, 0, GpuTimeQuery.TIMESTAMP_COUNT, this.resolveQueryBufer, 0);
        statistics.increment('api-calls', 1);
        if (this.resultQueryBuffer.mapState === 'unmapped') {
            commandEncoder.copyBufferToBuffer(this.resolveQueryBufer, 0, this.resultQueryBuffer, 0, this.resultQueryBuffer.size);
            statistics.increment('api-calls', 1);
        }
    }

    public update(): void {
        if (this.resultQueryBuffer.mapState === 'unmapped') {
            this.resultQueryBuffer.mapAsync(GPUMapMode.READ).then(() => {
                const times = new BigInt64Array(this.resultQueryBuffer.getMappedRange());
                const startTime = nanoSecondsToMilliseconds(Number(times[0]));
                const endTime = nanoSecondsToMilliseconds(Number(times[1]));
                this.handler(endTime - startTime);
                this.resultQueryBuffer.unmap();
                statistics.increment('api-calls', 2);
            });
            statistics.increment('api-calls', 1);
        }
    }

    public release(): void {
        if (this.valid) {
            this.querySet.destroy();
            this.resolveQueryBufer.destroy();
            this.resultQueryBuffer.destroy();
            statistics.increment('buffer-data', -2 * SIZEOF_LONG * GpuTimeQuery.TIMESTAMP_COUNT);
            statistics.increment('api-calls', 3);
            this.valid = false;
        }
    }
}
