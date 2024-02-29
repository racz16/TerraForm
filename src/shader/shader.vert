#if __VERSION__ == 100
    attribute vec3 vertexPosition;
    attribute vec3 vertexNormal;
    attribute mat4 M;
    attribute vec3 color;

    varying vec3 vf_normal;
    varying vec3 vf_color;

    uniform mat4 VP;
#else
    layout(location = 0) in vec3 vertexPosition;
    layout(location = 1) in vec3 vertexNormal;
    layout(location = 2) in mat4 M;
    layout(location = 6) in vec3 color;

    out vec3 vf_normal;
    out vec3 vf_color;

    layout(std140) uniform FrameData {
        mat4 VP;
        vec3 light;
    };
#endif

void main() {
    vf_normal = vertexNormal;
    vf_color = color;
    gl_Position = VP * M * vec4(vertexPosition, 1.0);
}
