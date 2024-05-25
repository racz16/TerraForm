import { statistics } from '../..';
import { TimeQueryDescriptor } from '../time-query';
import { EXTDisjointTimerQueryWebGL2 } from '../webgl/gl-extensions';
import { GlTimeQuery } from '../webgl/gl-time-query';
import { getGl2ContextWrapper } from './gl2-rendering-context';

export class Gl2TimeQuery extends GlTimeQuery {
    private query: WebGLQuery;
    protected context!: WebGL2RenderingContext;
    private gpuTimeExtension: EXTDisjointTimerQueryWebGL2;

    public constructor(descriptor: TimeQueryDescriptor) {
        super(descriptor);
        this.gpuTimeExtension = getGl2ContextWrapper().getGpuTimeExtension()!;
        this.query = this.context.createQuery()!;
        statistics.increment('api-calls', 1);
    }

    public getId(): WebGLQuery {
        return this.query;
    }

    public override begin(): void {
        if (!this.inProgress) {
            this.context.beginQuery(this.gpuTimeExtension.TIME_ELAPSED_EXT, this.query);
            statistics.increment('api-calls', 1);
        }
    }

    public override end(): void {
        if (!this.inProgress) {
            this.context.endQuery(this.gpuTimeExtension.TIME_ELAPSED_EXT);
            this.context.flush();
            statistics.increment('api-calls', 2);
            this.inProgress = true;
        }
    }

    protected override isResultAvailable(): boolean {
        statistics.increment('api-calls', 1);
        return this.context.getQueryParameter(this.query, this.context.QUERY_RESULT_AVAILABLE);
    }

    protected isResultValid(): boolean {
        statistics.increment('api-calls', 1);
        return !this.context.getParameter(this.gpuTimeExtension.GPU_DISJOINT_EXT);
    }

    protected override getResult(): number {
        statistics.increment('api-calls', 1);
        return this.context.getQueryParameter(this.query, this.context.QUERY_RESULT);
    }

    public release(): void {
        if (this.valid) {
            this.context.deleteQuery(this.query);
            statistics.increment('api-calls', 1);
            this.valid = false;
        }
    }
}
