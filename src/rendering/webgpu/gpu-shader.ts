import { statistics } from '../..';
import { numberSource } from '../../utility';
import { Shader, ShaderDescriptor } from '../shader';
import { ShaderLibrary } from '../shader-library';
import { getGpuDevice } from './gpu-rendering-context';

export class GpuShader implements Shader {
    private shaderModule: GPUShaderModule;

    public constructor(descriptor: ShaderDescriptor) {
        const source = ShaderLibrary.get(`gpu-${descriptor.name}`);
        this.shaderModule = getGpuDevice().createShaderModule({ code: source, label: descriptor.label });
        statistics.increment('api-calls', 1);
        if (DEVELOPMENT) {
            this.checkCompilationInfo(descriptor.name, source);
        }
    }

    public getId(): GPUShaderModule {
        return this.shaderModule;
    }

    private async checkCompilationInfo(name: string, source: string): Promise<void> {
        const compilationInfo = await this.shaderModule.getCompilationInfo();
        statistics.increment('api-calls', 1);
        if (compilationInfo.messages.length) {
            this.throwError(name, source, compilationInfo.messages);
        }
    }

    private throwError(name: string, source: string, errors: ReadonlyArray<GPUCompilationMessage>): void {
        let result = `Invalid shader '${name}'\n`;
        for (const error of errors) {
            result += error.message + `, line: ${error.lineNum}\n`;
        }
        result += numberSource(source);
        throw new Error(result);
    }

    public release(): void {}
}
