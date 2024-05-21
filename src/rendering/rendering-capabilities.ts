export interface RenderingCapabilities {
    uniformBuffer: boolean;
    gpuTimer: boolean;
    instancedRendering: boolean;
    isNdcCube: boolean;
    debugGroups: boolean;
    instanceOffset: boolean;
    depthTexture: boolean;
    uvUp: boolean;
    vertexArray: boolean;
}
