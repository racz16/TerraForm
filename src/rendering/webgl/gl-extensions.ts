export const GL1_GPU_TIME_EXTENSION = 'EXT_disjoint_timer_query';
export const GL2_GPU_TIME_EXTENSION = 'EXT_disjoint_timer_query_webgl2';
export const GL1_INSTANCED_RENDERING_EXTENSION = 'ANGLE_instanced_arrays';
export const GL_DEBUG_RENDERER_INFO = 'WEBGL_debug_renderer_info';
export const GL1_DEPTH_TEXTURE = 'WEBGL_depth_texture';

export interface WebGLRenderingContextBase {
    getExtension(extensionName: typeof GL1_GPU_TIME_EXTENSION): EXTDisjointTimerQuery | null;
}

export interface WebGLRenderingContextBase {
    getExtension(extensionName: typeof GL2_GPU_TIME_EXTENSION): EXTDisjointTimerQueryWebGL2 | null;
}

export interface WebGLTimerQueryEXT {}

export interface EXTDisjointTimerQuery {
    QUERY_COUNTER_BITS_EXT: GLenum;
    CURRENT_QUERY_EXT: GLenum;
    QUERY_RESULT_EXT: GLenum;
    QUERY_RESULT_AVAILABLE_EXT: GLenum;
    TIME_ELAPSED_EXT: GLenum;
    TIMESTAMP_EXT: GLenum;
    GPU_DISJOINT_EXT: GLenum;

    createQueryEXT(): WebGLTimerQueryEXT | undefined;
    deleteQueryEXT(query?: WebGLTimerQueryEXT): undefined;
    isQueryEXT(query?: WebGLTimerQueryEXT): boolean;
    beginQueryEXT(target: GLenum, query: WebGLTimerQueryEXT): undefined;
    endQueryEXT(target: GLenum): undefined;
    queryCounterEXT(query: WebGLTimerQueryEXT, target: GLenum): undefined;
    getQueryEXT(target: GLenum, pname: GLenum): any;
    getQueryObjectEXT(query: WebGLTimerQueryEXT, pname: GLenum): any;
}

export interface EXTDisjointTimerQueryWebGL2 {
    QUERY_COUNTER_BITS_EXT: GLenum;
    TIME_ELAPSED_EXT: GLenum;
    TIMESTAMP_EXT: GLenum;
    GPU_DISJOINT_EXT: GLenum;
    queryCounterEXT(query: WebGLQuery, target: GLenum): undefined;
}
