precision highp float;

#if __VERSION__ == 100
    varying vec3 vf_normal;
    varying vec3 vf_color;

    uniform vec3 light;
#else
    in vec3 vf_normal;
    in vec3 vf_color;

    layout(location = 0) out vec4 color;
    
    layout(std140) uniform frame_data {
        mat4 VP;
        vec3 light;
    };
#endif

void main() {
    vec3 N = normalize(vf_normal);
    vec3 L = light;
    vec3 result = vf_color * dot(N, -L);
    #if __VERSION__ == 100
        gl_FragColor = vec4(result, 1.0);
    #else
        color = vec4(result, 1.0);
    #endif
}
