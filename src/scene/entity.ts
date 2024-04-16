import { vec3 } from 'gl-matrix';

export interface Entity {
    readonly position: vec3;
    readonly rotation: vec3;
    readonly scale: vec3;
    readonly mesh: 'cube' | 'quad';
    readonly color: vec3;
}
