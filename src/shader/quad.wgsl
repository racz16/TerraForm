struct Vertex {
    @location(0) vertexPosition: vec3f,
    @location(2) vertexTextureCoordinate: vec2f,
};

struct Varying {
    @builtin(position) position: vec4f,
    @location(0) textureCoordinate: vec2f
};

@vertex fn vertex(vertex: Vertex) -> Varying {
    var vf_varying: Varying;
    vf_varying.position = vec4f(vertex.vertexPosition, 1.0);
    vf_varying.textureCoordinate = vertex.vertexTextureCoordinate;
    return vf_varying;
}

@group(0) @binding(0) var quadSampler: sampler;
@group(0) @binding(1) var quadTexture: texture_2d<f32>;

@fragment fn fragment(vf_varying: Varying) -> @location(0) vec4f {
    return textureSample(quadTexture, quadSampler, vf_varying.textureCoordinate);
}