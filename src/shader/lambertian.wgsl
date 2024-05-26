struct frame_data_t {
    VP: mat4x4f,
    light: vec3f
};

@group(0) @binding(0) var<uniform> frame_data: frame_data_t;

struct vertex_t {
    @location(0) vertex_position_u: vec4f,
    @location(1) vertex_normal_v: vec4f,
};

struct instance_t {
    @location(2) instance_position_scale: vec4f,
    @location(3) instance_rotation: vec3f,
    @location(4) instance_color: vec3f,
};

struct varying_t {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
    @location(1) color: vec3f
};

fn create_model_matrix(position: vec3f, rotation: vec3f, scale: f32) -> mat4x4f {
    var cx = cos(rotation.x);
    var sx = sin(rotation.x);
    var cy = cos(rotation.y);
    var sy = sin(rotation.y);
    var cz = cos(rotation.z);
    var sz = sin(rotation.z);

    return mat4x4f(
        scale * (cy * cz),                  scale * (cy * sz),                  scale * (-sy),       0,
        scale * (sx * sy * cz - cx * sz),   scale * (sx * sy * sz + cx * cz),   scale * (sx * cy),   0,
        scale * (cx * sy * cz + sx * sz),   scale * (cx * sy * sz - sx * cz),   scale * (cx * cy),   0,
        position.x,                         position.y,                         position.z,          1
    );
}

@vertex fn vertex(vertex: vertex_t, instance: instance_t) -> varying_t {
    var vertex_position = vertex.vertex_position_u.xyz;
    var vertex_normal = vertex.vertex_normal_v.xyz;
    var instance_position = instance.instance_position_scale.xyz;
    var instance_scale = instance.instance_position_scale.w;
    let M = create_model_matrix(instance_position, instance.instance_rotation, instance_scale);
    var vf_varying: varying_t;
    vf_varying.position = frame_data.VP * M * vec4f(vertex_position, 1.0);
    vf_varying.normal = mat3x3f(M[0].xyz, M[1].xyz, M[2].xyz) * vertex_normal;
    vf_varying.color = instance.instance_color;
    return vf_varying;
}

@fragment fn fragment(vf_varying: varying_t) -> @location(0) vec4f {
    let N = normalize(vf_varying.normal);
    let L = frame_data.light;
    return vec4f(vf_varying.color * dot(N, -L), 1.0);
}
