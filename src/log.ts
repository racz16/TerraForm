import { mat2, mat3, mat4, vec2, vec3, vec4 } from 'gl-matrix';

export function logVec2(vector: vec2): void {
    console.table([vector[0], vector[1]]);
}

export function logVec3(vector: vec3): void {
    console.table([vector[0], vector[1], vector[2]]);
}

export function logVec4(vector: vec4): void {
    console.table([vector[0], vector[1], vector[2], vector[3]]);
}

export function logMat2(matrix: mat2): void {
    console.table([
        [matrix[0], matrix[2]],
        [matrix[1], matrix[3]],
    ]);
}

export function logMat3(matrix: mat3): void {
    console.table([ 
        [matrix[0], matrix[3], matrix[6]],
        [matrix[1], matrix[4], matrix[7]],
        [matrix[2], matrix[5], matrix[8]],
    ]);
}

export function logMat4(matrix: mat4): void {
    console.table([
        [matrix[0], matrix[4], matrix[8], matrix[12]],
        [matrix[1], matrix[5], matrix[9], matrix[13]],
        [matrix[2], matrix[6], matrix[10], matrix[14]],
        [matrix[3], matrix[7], matrix[11], matrix[15]],
    ]);
}
