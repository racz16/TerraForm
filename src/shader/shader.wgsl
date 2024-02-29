struct Uniform {
    VP: mat4x4f,
    light: vec3f
};

@group(0) @binding(0) var<uniform> uni: Uniform;

struct Vertex {
    @location(0) vertexPosition: vec3f,
    @location(1) vertexNormal: vec3f,
    @location(2) M1: vec4f,
    @location(3) M2: vec4f,
    @location(4) M3: vec4f,
    @location(5) M4: vec4f,
    @location(6) color: vec3f
};

struct Varying {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
    @location(1) color: vec3f
};

@vertex fn vertex(vertex: Vertex) -> Varying {
    var v: Varying;
    let M = mat4x4f(vertex.M1, vertex.M2, vertex.M3, vertex.M4);
    v.position = uni.VP * M * vec4f(vertex.vertexPosition, 1.0);
    v.normal = vertex.vertexNormal;
    v.color = vertex.color;
    return v;
}

@fragment fn fragment(v: Varying) -> @location(0) vec4f {
    let N = normalize(v.normal);
    let L = uni.light;
    return vec4f(v.color * dot(N, -L), 1.0);
}
