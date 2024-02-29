import { statistics } from '../..';
import { getGl1Context } from '../rendering-context';
import { TimeQueryDescriptor } from '../time-query';
import { EXTDisjointTimerQuery } from '../webgl/gl-extensions';
import { GlTimeQuery } from '../webgl/gl-time-query';

export class Gl1TimeQuery extends GlTimeQuery {
    private query: WebGLQuery;
    private gpuTimeExtension: EXTDisjointTimerQuery;

    public constructor(descriptor: TimeQueryDescriptor) {
        super(descriptor);
        this.gpuTimeExtension = getGl1Context().getGpuTimeExtension()!;
        this.query = this.gpuTimeExtension.createQueryEXT()!;
        statistics.increment('api-calls', 1);
    }

    public override getId(): WebGLQuery {
        return this.query;
    }

    public override begin(): void {
        if (!this.inProgress) {
            this.gpuTimeExtension.beginQueryEXT(this.gpuTimeExtension.TIME_ELAPSED_EXT, this.query);
            statistics.increment('api-calls', 1);
        }
    }

    public override end(): void {
        if (!this.inProgress) {
            this.gpuTimeExtension.endQueryEXT(this.gpuTimeExtension.TIME_ELAPSED_EXT);
            statistics.increment('api-calls', 1);
            this.inProgress = true;
        }
    }

    protected override isResultAvailable(): boolean {
        statistics.increment('api-calls', 1);
        return this.gpuTimeExtension.getQueryObjectEXT(this.query, this.gpuTimeExtension.QUERY_RESULT_AVAILABLE_EXT);
    }

    protected override getResult(): number {
        statistics.increment('api-calls', 1);
        return this.gpuTimeExtension.getQueryObjectEXT(this.query, this.gpuTimeExtension.QUERY_RESULT_EXT);
    }

    public override release(): void {
        this.gpuTimeExtension.deleteQueryEXT(this.query);
        statistics.increment('api-calls', 1);
    }
}
