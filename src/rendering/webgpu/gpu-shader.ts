import { statistics } from '../..';
import { getGpuContext } from '../rendering-context';
import { Shader, ShaderDescriptor } from '../shader';
import { ShaderLibrary } from '../shader-library';

export class GpuShader implements Shader {
    private shaderModule: GPUShaderModule;

    public constructor(descriptor: ShaderDescriptor) {
        this.shaderModule = getGpuContext()
            .getDevice()
            .createShaderModule({ code: ShaderLibrary.get(`gpu-${descriptor.name}`), label: descriptor.label });
        statistics.increment('api-calls', 1);
        if (DEVELOPMENT) {
            this.logCompilationInfo();
        }
    }

    public getId(): GPUShaderModule {
        return this.shaderModule;
    }

    private async logCompilationInfo(): Promise<void> {
        if (DEVELOPMENT) {
            const compilationInfo = await this.shaderModule.getCompilationInfo();
            statistics.increment('api-calls', 1);
            compilationInfo.messages.forEach((m) => console.log(m));
        }
    }

    public getShaderModule(): GPUShaderModule {
        return this.shaderModule;
    }

    public release(): void {}
}
