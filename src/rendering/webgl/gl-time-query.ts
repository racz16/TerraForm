import { nanoSecondsToMilliseconds } from '../../utility';
import { TimeQuery, TimeQueryDescriptor, TimeQueryHandler } from '../time-query';

export abstract class GlTimeQuery implements TimeQuery {
    protected inProgress = false;
    protected handler: TimeQueryHandler;

    public constructor(descriptor: TimeQueryDescriptor) {
        this.handler = descriptor.handler;
    }

    public abstract getId(): any;

    public abstract begin(): void;

    public abstract end(): void;

    public update(): void {
        if (this.inProgress && this.isResultAvailable()) {
            const elapsed = this.getResult();
            this.handler(nanoSecondsToMilliseconds(elapsed));
            this.inProgress = false;
        }
    }

    protected abstract isResultAvailable(): boolean;

    protected abstract getResult(): number;

    public abstract release(): void;
}
