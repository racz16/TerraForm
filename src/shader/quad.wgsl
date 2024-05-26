struct vertex_t {
    @location(0) vertex_position: vec3f,
    @location(1) vertex_tc: vec2f,
};

struct varying_t {
    @builtin(position) position: vec4f,
    @location(0) tc: vec2f
};

@vertex fn vertex(vertex: vertex_t) -> varying_t {
    var vf_varying: varying_t;
    vf_varying.position = vec4f(vertex.vertex_position, 1.0);
    vf_varying.tc = vertex.vertex_tc;
    return vf_varying;
}

@group(0) @binding(0) var quad_sampler: sampler;
@group(0) @binding(1) var quad_texture: texture_2d<f32>;

@fragment fn fragment(vf_varying: varying_t) -> @location(0) vec4f {
    return textureSample(quad_texture, quad_sampler, vf_varying.tc);
}