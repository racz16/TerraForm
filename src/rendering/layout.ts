import { MAT4_ITEM_COUNT, VEC3_ITEM_COUNT, SIZEOF_FLOAT, VEC4_ITEM_COUNT, VEC2_ITEM_COUNT } from '../constants';
import { VertexAttributeFormat, VertexBufferLayout } from './pipeline';

const VERTEX_POSITION_INDEX = 0;
const VERTEX_NORMAL_INDEX = 1;
const VERTEX_TEXTURE_COORDINATE_INDEX = 2;
const INSTANCE_MODEL_MATRIX_INDEX = 3;
const INSTANCE_COLOR_INDEX = 7;

export const VERTEX_BUFFER_INDEX = 0;
export const INSTANCE_BUFFER_INDEX = 1;

export const vertexLayout: VertexBufferLayout = {
    stride: (2 * VEC3_ITEM_COUNT + VEC2_ITEM_COUNT) * SIZEOF_FLOAT,
    isInstanced: false,
    attributes: [
        {
            index: VERTEX_POSITION_INDEX,
            offset: 0,
            format: VertexAttributeFormat.FLOAT_3,
        },
        {
            index: VERTEX_NORMAL_INDEX,
            offset: VEC3_ITEM_COUNT * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_3,
        },
        {
            index: VERTEX_TEXTURE_COORDINATE_INDEX,
            offset: 2 * VEC3_ITEM_COUNT * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_2,
        },
    ],
};

export const instanceLayout: VertexBufferLayout = {
    stride: (MAT4_ITEM_COUNT + VEC3_ITEM_COUNT) * SIZEOF_FLOAT,
    isInstanced: true,
    attributes: [
        {
            index: INSTANCE_MODEL_MATRIX_INDEX,
            offset: 0,
            format: VertexAttributeFormat.FLOAT_4,
        },
        {
            index: INSTANCE_MODEL_MATRIX_INDEX + 1,
            offset: VEC4_ITEM_COUNT * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_4,
        },
        {
            index: INSTANCE_MODEL_MATRIX_INDEX + 2,
            offset: 2 * VEC4_ITEM_COUNT * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_4,
        },
        {
            index: INSTANCE_MODEL_MATRIX_INDEX + 3,
            offset: 3 * VEC4_ITEM_COUNT * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_4,
        },
        {
            index: INSTANCE_COLOR_INDEX,
            offset: MAT4_ITEM_COUNT * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_3,
        },
    ],
};
