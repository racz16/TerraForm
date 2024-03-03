import { rendering } from '..';
import { SIZEOF_FLOAT, SIZEOF_SHORT, VEC3_ITEM_COUNT } from '../constants';
import { BufferUsage, createBuffer } from '../rendering/buffer';

export interface Mesh {
    readonly name: string;
    readonly vertexCount: number;
    readonly indexCount: number;
    readonly vertexBufferIndex: number;
    readonly indexBufferIndex: number;
}

const SIDE_VERTEX_COUNT = 4;
const SIDE_TRIANGLE_COUNT = 2;
const TRIANGLE_VERTEX_COUNT = 3;
const VERTEX_ATTRIBUTE_COUNT = 2;

export function addQuadMesh(): void {
    const vertexBuffer = createBuffer({
        type: 'data-callback',
        callback: (data) => {
            const vertexData = new Float32Array(data);
            vertexData.set([
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
        },
        size: SIDE_VERTEX_COUNT * VERTEX_ATTRIBUTE_COUNT * VEC3_ITEM_COUNT * SIZEOF_FLOAT,
        usage: BufferUsage.VERTEX,
        label: 'Quad vertex buffer',
    });
    const indexBuffer = createBuffer({
        type: 'data-callback',
        callback: (data) => {
            const indexData = new Uint16Array(data);
            indexData.set([0, 1, 2, 3, 0, 2]);
        },
        size: SIDE_TRIANGLE_COUNT * TRIANGLE_VERTEX_COUNT * SIZEOF_SHORT,
        usage: BufferUsage.INDEX,
        label: 'Quad index buffer',
    });
    rendering.addMesh('quad', vertexBuffer, indexBuffer, SIDE_VERTEX_COUNT, SIDE_TRIANGLE_COUNT * TRIANGLE_VERTEX_COUNT);
    if (DEVELOPMENT) {
        console.log('Quad mesh created');
    }
}

export function addCubeMesh(): void {
    const SIDE_COUNT = 6;
    const vertexBuffer = createBuffer({
        type: 'data-callback',
        callback: (data) => {
            const vertexData = new Float32Array(data);
            vertexData.set([
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
        },
        size: SIDE_COUNT * SIDE_VERTEX_COUNT * VERTEX_ATTRIBUTE_COUNT * VEC3_ITEM_COUNT * SIZEOF_FLOAT,
        usage: BufferUsage.VERTEX,
        label: 'Cube vertex buffer',
    });
    const indexBuffer = createBuffer({
        type: 'data-callback',
        callback: (data) => {
            const indexData = new Uint16Array(data);
            indexData.set([
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
        },
        size: SIDE_COUNT * SIDE_TRIANGLE_COUNT * TRIANGLE_VERTEX_COUNT * SIZEOF_SHORT,
        usage: BufferUsage.INDEX,
        label: 'Cube index buffer',
    });
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
