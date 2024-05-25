import { statistics } from '../..';
import { TimeQueryDescriptor } from '../time-query';
import { EXTDisjointTimerQuery } from '../webgl/gl-extensions';
import { GlTimeQuery } from '../webgl/gl-time-query';
import { getGl1ContextWrapper } from './gl1-rendering-context';

export class Gl1TimeQuery extends GlTimeQuery {
    private query: WebGLQuery;
    private gpuTimeExtension: EXTDisjointTimerQuery;

    public constructor(descriptor: TimeQueryDescriptor) {
        super(descriptor);
        this.gpuTimeExtension = getGl1ContextWrapper().getGpuTimeExtension()!;
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
            this.context.flush();
            statistics.increment('api-calls', 2);
            this.inProgress = true;
        }
    }

    protected override isResultAvailable(): boolean {
        statistics.increment('api-calls', 1);
        return this.gpuTimeExtension.getQueryObjectEXT(this.query, this.gpuTimeExtension.QUERY_RESULT_AVAILABLE_EXT);
    }

    protected isResultValid(): boolean {
        statistics.increment('api-calls', 1);
        return !this.context.getParameter(this.gpuTimeExtension.GPU_DISJOINT_EXT);
    }

    protected override getResult(): number {
        statistics.increment('api-calls', 1);
        return this.gpuTimeExtension.getQueryObjectEXT(this.query, this.gpuTimeExtension.QUERY_RESULT_EXT);
    }

    public override release(): void {
        if (this.valid) {
            this.gpuTimeExtension.deleteQueryEXT(this.query);
            statistics.increment('api-calls', 1);
            this.valid = false;
        }
    }
}
