#if __VERSION__ == 100
    attribute vec3 vertex_position_u;
    attribute vec3 vertex_normal_v;
    attribute vec4 instance_position_scale;
    attribute vec3 instance_rotation;
    attribute vec3 instance_color;

    varying vec3 vf_normal;
    varying vec3 vf_color;

    uniform mat4 VP;
#else
    layout(location = 0) in vec3 vertex_position_u;
    layout(location = 1) in vec3 vertex_normal_v;
    layout(location = 2) in vec4 instance_position_scale;
    layout(location = 3) in vec3 instance_rotation;
    layout(location = 4) in vec3 instance_color;

    out vec3 vf_normal;
    out vec3 vf_color;

    layout(std140) uniform frame_data {
        mat4 VP;
        vec3 light;
    };
#endif

mat4 create_model_matrix(vec3 position, vec3 rotation, float scale) {
    float cx = cos(rotation.x);
    float sx = sin(rotation.x);
    float cy = cos(rotation.y);
    float sy = sin(rotation.y);
    float cz = cos(rotation.z);
    float sz = sin(rotation.z);

    return mat4(
        scale * (cy * cz),                  scale * (cy * sz),                  scale * (-sy),       0,
        scale * (sx * sy * cz - cx * sz),   scale * (sx * sy * sz + cx * cz),   scale * (sx * cy),   0,
        scale * (cx * sy * cz + sx * sz),   scale * (cx * sy * sz - sx * cz),   scale * (cx * cy),   0,
        position.x,                         position.y,                         position.z,          1
    );
}

void main() {
    vec3 vertex_position = vertex_position_u.xyz;
    vec3 vertex_normal = vertex_normal_v.xyz;
    vec3 instance_position = instance_position_scale.xyz;
    float instance_scale = instance_position_scale.w;
    mat4 M = create_model_matrix(instance_position, instance_rotation, instance_scale);
    gl_Position = VP * M * vec4(vertex_position, 1.0);
    vf_normal = mat3(M) * vertex_normal;
    vf_color = instance_color;
}
