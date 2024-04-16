#if __VERSION__ == 100
    attribute vec3 vertexPosition;
    attribute vec2 vertexTextureCoordinate;

    varying vec2 vf_vertexTextureCoordinate;
#else
    layout(location = 0) in vec3 vertexPosition;
    layout(location = 2) in vec2 vertexTextureCoordinate;

    out vec2 vf_vertexTextureCoordinate;
#endif

void main() {
    vf_vertexTextureCoordinate = vertexTextureCoordinate;
    gl_Position = vec4(vertexPosition, 1.0);
}
