import { vec3 } from 'gl-matrix';

export interface Entity {
    readonly position: vec3;
    readonly rotation: vec3;
    readonly scale: number;
    readonly mesh: 'cube' | 'plane';
    readonly color: vec3;
}
