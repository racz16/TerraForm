import { statistics } from '../..';
import { getGl2Context } from '../rendering-context';
import { TimeQueryDescriptor } from '../time-query';
import { GlTimeQuery } from '../webgl/gl-time-query';

export class Gl2TimeQuery extends GlTimeQuery {
    private query: WebGLQuery;
    private context: WebGL2RenderingContext;

    public constructor(descriptor: TimeQueryDescriptor) {
        super(descriptor);
        this.context = getGl2Context().getId();
        this.query = this.context.createQuery()!;
        statistics.increment('api-calls', 1);
    }

    public getId(): WebGLQuery {
        return this.query;
    }

    public override begin(): void {
        if (!this.inProgress) {
            this.context.beginQuery(getGl2Context().getGpuTimeExtension()!.TIME_ELAPSED_EXT, this.query);
            statistics.increment('api-calls', 1);
        }
    }

    public override end(): void {
        if (!this.inProgress) {
            this.context.endQuery(getGl2Context().getGpuTimeExtension()!.TIME_ELAPSED_EXT);
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
        return !this.context.getParameter(getGl2Context().getGpuTimeExtension()!.GPU_DISJOINT_EXT);
    }

    protected override getResult(): number {
        statistics.increment('api-calls', 1);
        return this.context.getQueryParameter(this.query, this.context.QUERY_RESULT);
    }

    public release(): void {
        this.context.deleteQuery(this.query);
        statistics.increment('api-calls', 1);
    }
}
