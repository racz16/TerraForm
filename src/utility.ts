import { glMatrix, mat2, mat3, mat4, quat, vec2, vec3, vec4 } from 'gl-matrix';

import { SIZEOF_FLOAT, MAT4_ITEM_COUNT } from './constants';
import { rendering } from '.';

export type MathType = vec2 | vec3 | vec4 | mat2 | mat3 | mat4 | quat;

const conversionArrayBuffer = new ArrayBuffer(MAT4_ITEM_COUNT * SIZEOF_FLOAT);
const conversionTypedArrays = createConversionTypedArrays();
const vec3Pool: vec3[] = [];

function createConversionTypedArrays(): Float32Array[] {
    const result: Float32Array[] = [];
    for (let i = 1; i <= MAT4_ITEM_COUNT; i++) {
        result.push(new Float32Array(conversionArrayBuffer, 0, i));
    }
    return result;
}

export function mathTypeToTypedArray(mathType: MathType): Float32Array {
    const array = mathType as number[];
    const conversionTypedArray = conversionTypedArrays[array.length - 1];
    conversionTypedArray.set(array);
    return conversionTypedArray;
}

export function getElement<T extends Element = HTMLDivElement>(cssSelector: string): T {
    const element = document.querySelector<T>(cssSelector);
    if (DEVELOPMENT) {
        if (!element) {
            throw new Error(`Couldn't find UI element with CSS selector: "${cssSelector}"`);
        }
    }
    return element!;
}

export function bytesToMegaBytes(sizeInBytes: number): number {
    return sizeInBytes / 1024 / 1024;
}

export function secondsToMilliseconds(timeInSeconds: number): number {
    return timeInSeconds * 1000;
}

export function nanoSecondsToMilliseconds(timeInNanoseconds: number): number {
    return timeInNanoseconds / 1000 / 1000;
}

export function fovYToFovX(fovY: number, aspectRatio?: number): number {
    if (!aspectRatio) {
        const canvas = rendering.getCanvas();
        aspectRatio = canvas.clientWidth / canvas.clientHeight;
    }
    return 2 * Math.atan(Math.tan(glMatrix.toRadian(fovY) * 0.5) * aspectRatio);
}

export function createVec3(x: number, y: number, z: number): vec3 {
    const result = vec3Pool.pop();
    if (result) {
        return vec3.set(result, x, y, z);
    } else {
        return vec3.fromValues(x, y, z);
    }
}

export function addToVec3Pool(vec: vec3): void {
    vec3Pool.push(vec);
}
