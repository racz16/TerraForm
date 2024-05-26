precision highp float;

#if __VERSION__ == 100
    varying vec2 vf_tc;
#else
    in vec2 vf_tc;

    layout(location = 0) out vec4 color;
#endif

uniform sampler2D image;

void main() {
    #if __VERSION__ == 100
        gl_FragColor = texture2D(image, vf_tc);
    #else
        color = texture(image, vf_tc);
    #endif
}
