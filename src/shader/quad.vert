#if __VERSION__ == 100
    attribute vec3 vertex_position;
    attribute vec2 vertex_tc;

    varying vec2 vf_tc;
#else
    layout(location = 0) in vec3 vertex_position;
    layout(location = 1) in vec2 vertex_tc;

    out vec2 vf_tc;
#endif

void main() {
    vf_tc = vertex_tc;
    gl_Position = vec4(vertex_position, 1.0);
}
