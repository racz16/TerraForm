import { VEC3_ITEM_COUNT, SIZEOF_FLOAT, VEC4_ITEM_COUNT, VEC2_ITEM_COUNT } from '../constants';
import { VertexAttributeFormat, VertexBufferLayout } from './pipeline';

export const VERTEX_BUFFER_INDEX = 0;
export const INSTANCE_BUFFER_INDEX = 1;

const LAMBERTIAN_POSITION_U_INDEX = 0;
const LAMBERTIAN_NORMAL_V_INDEX = 1;

export const lambertianVertexLayout: VertexBufferLayout = {
    stride: (2 * VEC3_ITEM_COUNT + VEC2_ITEM_COUNT) * SIZEOF_FLOAT,
    instanced: false,
    attributes: [
        {
            index: LAMBERTIAN_POSITION_U_INDEX,
            name: 'vertex_position_u',
            offset: 0,
            format: VertexAttributeFormat.FLOAT_4,
        },
        {
            index: LAMBERTIAN_NORMAL_V_INDEX,
            name: 'vertex_normal_v',
            offset: VEC4_ITEM_COUNT * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_4,
        },
    ],
};

const QUAD_POSITION_INDEX = 0;
const QUAD_TEXTURE_COORDINATE_INDEX = 1;

export const quadVertexLayout: VertexBufferLayout = {
    stride: (VEC3_ITEM_COUNT + VEC2_ITEM_COUNT) * SIZEOF_FLOAT,
    instanced: false,
    attributes: [
        {
            index: QUAD_POSITION_INDEX,
            name: 'vertex_position',
            offset: 0,
            format: VertexAttributeFormat.FLOAT_3,
        },
        {
            index: QUAD_TEXTURE_COORDINATE_INDEX,
            name: 'vertex_tc',
            offset: VEC3_ITEM_COUNT * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_2,
        },
    ],
};

const INSTANCE_POSITION_SCALE_INDEX = 2;
const INSTANCE_ROTATION_INDEX = 3;
const INSTANCE_COLOR_INDEX = 4;

export const instanceLayout: VertexBufferLayout = {
    stride: (VEC4_ITEM_COUNT + 2 * VEC3_ITEM_COUNT) * SIZEOF_FLOAT,
    instanced: true,
    attributes: [
        {
            index: INSTANCE_POSITION_SCALE_INDEX,
            name: 'instance_position_scale',
            offset: 0,
            format: VertexAttributeFormat.FLOAT_4,
        },
        {
            index: INSTANCE_ROTATION_INDEX,
            name: 'instance_rotation',
            offset: VEC4_ITEM_COUNT * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_3,
        },
        {
            index: INSTANCE_COLOR_INDEX,
            name: 'instance_color',
            offset: (VEC4_ITEM_COUNT + VEC3_ITEM_COUNT) * SIZEOF_FLOAT,
            format: VertexAttributeFormat.FLOAT_3,
        },
    ],
};
