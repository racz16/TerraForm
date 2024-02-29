import { isWebGL1, isWebGL2 } from './rendering';
import { Gl1TimeQuery } from './webgl1/gl1-time-query';
import { Gl2TimeQuery } from './webgl2/gl2-time-query';
import { GpuTimeQuery } from './webgpu/gpu-time-query';

export type TimeQueryHandler = (elapsedTime: number) => void;

export interface TimeQuery {
    getId(): any;
    release(): void;
}

export interface TimeQueryDescriptor {
    handler: TimeQueryHandler;
    label?: string;
}

export function createTimeQuery(descriptor: TimeQueryDescriptor): TimeQuery {
    if (isWebGL1()) {
        return new Gl1TimeQuery(descriptor);
    } else if (isWebGL2()) {
        return new Gl2TimeQuery(descriptor);
    } else {
        return new GpuTimeQuery(descriptor);
    }
}
