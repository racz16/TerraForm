import { statistics } from '../..';
import shaderCode from '../../shader/shader.wgsl';
import { getGpuContext } from '../rendering-context';

import { Shader, ShaderDescriptor } from '../shader';

export class GpuShader implements Shader {
    private shaderModule: GPUShaderModule;

    public constructor(desriptor: ShaderDescriptor) {
        this.shaderModule = getGpuContext().getDevice().createShaderModule({ code: shaderCode, label: desriptor.label });
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
