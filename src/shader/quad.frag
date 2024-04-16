precision highp float;

#if __VERSION__ == 100
    varying vec2 vf_vertexTextureCoordinate;
#else
    in vec2 vf_vertexTextureCoordinate;

    layout(location = 0) out vec4 color;
#endif

uniform sampler2D image;

void main() {
    #if __VERSION__ == 100
        gl_FragColor = texture2D(image, vf_vertexTextureCoordinate);
    #else
        color = texture(image, vf_vertexTextureCoordinate);
    #endif
}
