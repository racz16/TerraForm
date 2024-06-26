import { nanoSecondsToMilliseconds } from '../../utility';
import { TimeQuery, TimeQueryDescriptor, TimeQueryHandler } from '../time-query';
import { getGlContext } from './gl-rendering-context';

export abstract class GlTimeQuery implements TimeQuery {
    protected context = getGlContext();
    protected inProgress = false;
    protected handler: TimeQueryHandler;
    protected valid = true;

    public constructor(descriptor: TimeQueryDescriptor) {
        this.handler = descriptor.handler;
    }

    public abstract getId(): any;

    public abstract begin(): void;

    public abstract end(): void;

    public update(): void {
        if (this.inProgress && this.isResultAvailable()) {
            if (this.isResultValid()) {
                const elapsed = this.getResult();
                this.handler(nanoSecondsToMilliseconds(elapsed));
            }
            this.inProgress = false;
        }
    }

    protected abstract isResultAvailable(): boolean;

    protected abstract isResultValid(): boolean;

    protected abstract getResult(): number;

    public abstract release(): void;
}
