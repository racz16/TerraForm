struct FrameData {
    VP: mat4x4f,
    light: vec3f
};

@group(0) @binding(0) var<uniform> frameData: FrameData;

struct Vertex {
    @location(0) vertexPosition: vec3f,
    @location(1) vertexNormal: vec3f,
    @location(3) M1: vec4f,
    @location(4) M2: vec4f,
    @location(5) M3: vec4f,
    @location(6) M4: vec4f,
    @location(7) color: vec3f
};

struct Varying {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
    @location(1) color: vec3f
};

@vertex fn vertex(vertex: Vertex) -> Varying {
    var vf_varying: Varying;
    let M = mat4x4f(vertex.M1, vertex.M2, vertex.M3, vertex.M4);
    vf_varying.position = frameData.VP * M * vec4f(vertex.vertexPosition, 1.0);
    vf_varying.normal = vertex.vertexNormal;
    vf_varying.color = vertex.color;
    return vf_varying;
}

@fragment fn fragment(vf_varying: Varying) -> @location(0) vec4f {
    let N = normalize(vf_varying.normal);
    let L = frameData.light;
    return vec4f(vf_varying.color * dot(N, -L), 1.0);
}
