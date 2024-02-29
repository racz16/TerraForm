import { rendering } from '..';
import { BufferUsage, createBuffer } from '../rendering/buffer';

export interface Mesh {
    readonly name: string;
    readonly vertexCount: number;
    readonly indexCount: number;
    readonly vertexBufferIndex: number;
    readonly indexBufferIndex: number;
}

export function addQuadMesh(): void {
    const vertexData = new Float32Array([
        // top-left vertex
        -0.5, 0, -0.5,
        //normal
        0, 1, 0,
        // bottom-left vertex
        -0.5, 0, 0.5,
        //normal
        0, 1, 0,
        // bottom-right vertex
        0.5, 0, 0.5,
        //normal
        0, 1, 0,
        // top-right vertex
        0.5, 0, -0.5,
        //normal
        0, 1, 0,
    ]);
    const vertexBuffer = createBuffer({
        type: 'data',
        data: vertexData,
        usage: BufferUsage.VERTEX,
        label: 'Quad vertex buffer',
    });
    const indexData = new Uint16Array([0, 1, 2, 3, 0, 2]);
    const indexBuffer = createBuffer({
        type: 'data',
        data: indexData,
        usage: BufferUsage.INDEX,
        label: 'Quad index buffer',
    });
    const VERTEX_COUNT = 4;
    const TRIANGLE_COUNT = 2;
    const TRIANGLE_VERTEX_COUNT = 3;
    rendering.addMesh('quad', vertexBuffer, indexBuffer, VERTEX_COUNT, TRIANGLE_COUNT * TRIANGLE_VERTEX_COUNT);
    if (DEVELOPMENT) {
        console.log('Quad mesh created');
    }
}

export function addCubeMesh(): void {
    const vertexData = new Float32Array([
        // FRONT FACE
        // -- top-left vertex
        // ---- position
        -0.5, 0.5, 0.5,
        // ---- normal
        0, 0, 1,
        // -- bottom-left vertex
        // ---- position
        -0.5, -0.5, 0.5,
        // ---- normal
        0, 0, 1,
        // -- bottom-right vertex
        // ---- position
        0.5, -0.5, 0.5,
        // ---- normal
        0, 0, 1,
        // -- top-right vertex
        // ---- position
        0.5, 0.5, 0.5,
        // ---- normal
        0, 0, 1,

        // LEFT FACE
        // -- top-left vertex
        // ---- position
        -0.5, 0.5, -0.5,
        // ---- normal
        -1, 0, 0,
        // -- bottom-left vertex
        // ---- position
        -0.5, -0.5, -0.5,
        // ---- normal
        -1, 0, 0,
        // -- bottom-right vertex
        // ---- position
        -0.5, -0.5, 0.5,
        // ---- normal
        -1, 0, 0,
        // -- top-right vertex
        // ---- position
        -0.5, 0.5, 0.5,
        // ---- normal
        -1, 0, 0,

        // RIGHT FACE
        // -- top-left vertex
        // ---- position
        0.5, 0.5, 0.5,
        // ---- normal
        1, 0, 0,
        // -- bottom-left vertex
        // ---- position
        0.5, -0.5, 0.5,
        // ---- normal
        1, 0, 0,
        // -- bottom-right vertex
        // ---- position
        0.5, -0.5, -0.5,
        // ---- normal
        1, 0, 0,
        // -- top-right vertex
        // ---- position
        0.5, 0.5, -0.5,
        // ---- normal
        1, 0, 0,

        // BACK FACE
        // -- top-left vertex
        // ---- position
        0.5, 0.5, -0.5,
        // ---- normal
        0, 0, -1,
        // -- bottom-left vertex
        // ---- position
        0.5, -0.5, -0.5,
        // ---- normal
        0, 0, -1,
        // -- bottom-right vertex
        // ---- position
        -0.5, -0.5, -0.5,
        // ---- normal
        0, 0, -1,
        // -- top-right vertex
        // ---- position
        -0.5, 0.5, -0.5,
        // ---- normal
        0, 0, -1,

        // TOP FACE
        // -- top-left vertex
        // ---- position
        -0.5, 0.5, -0.5,
        // ---- normal
        0, 1, 0,
        // -- bottom-left vertex
        // ---- position
        -0.5, 0.5, 0.5,
        // ---- normal
        0, 1, 0,
        // -- bottom-right vertex
        // ---- position
        0.5, 0.5, 0.5,
        // ---- normal
        0, 1, 0,
        // -- top-right vertex
        // ---- position
        0.5, 0.5, -0.5,
        // ---- normal
        0, 1, 0,

        // BOTTOM FACE
        // -- top-left vertex
        // ---- position
        -0.5, -0.5, 0.5,
        // ---- normal
        0, -1, 0,
        // -- bottom-left vertex
        // ---- position
        -0.5, -0.5, -0.5,
        // ---- normal
        0, -1, 0,
        // -- bottom-right vertex
        // ---- position
        0.5, -0.5, -0.5,
        // ---- normal
        0, -1, 0,
        // -- top-right vertex
        // ---- position
        0.5, -0.5, 0.5,
        // ---- normal
        0, -1, 0,
    ]);
    const vertexBuffer = createBuffer({
        type: 'data',
        data: vertexData,
        usage: BufferUsage.VERTEX,
        label: 'Cube vertex buffer',
    });
    const indexData = new Uint16Array([
        // front
        0, 1, 2, 3, 0, 2,
        //left
        4, 5, 6, 7, 4, 6,
        //right
        8, 9, 10, 11, 8, 10,
        //back
        12, 13, 14, 15, 12, 14,
        //back
        16, 17, 18, 19, 16, 18,
        //bottom
        20, 21, 22, 23, 20, 22,
    ]);
    const indexBuffer = createBuffer({
        type: 'data',
        data: indexData,
        usage: BufferUsage.INDEX,
        label: 'Cube index buffer',
    });
    const SIDE_COUNT = 6;
    const SIDE_VERTEX_COUNT = 4;
    const SIDE_TRIANGLE_COUNT = 2;
    const TRIANGLE_VERTEX_COUNT = 3;
    rendering.addMesh(
        'cube',
        vertexBuffer,
        indexBuffer,
        SIDE_COUNT * SIDE_VERTEX_COUNT,
        SIDE_COUNT * SIDE_TRIANGLE_COUNT * TRIANGLE_VERTEX_COUNT
    );
    if (DEVELOPMENT) {
        console.log('Cube mesh created');
    }
}
