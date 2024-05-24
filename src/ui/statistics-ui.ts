import { bytesToMegaBytes, getElement, secondsToMilliseconds } from '../utility';
import { options, rendering, statistics, time } from '..';
import { StatisticKey } from '../statistics';
import { toStringRenderingApi } from '../rendering/rendering';

export class StatisticsUi {
    private statisticsElement = getElement('#statistics');
    private renderingApiElement = getElement('#rendering-api');
    private fpsFrameTimeElement = getElement('#fps-frame-time');
    private cpuTimeElement = getElement('#cpu-time');
    private gpuTimeElement = getElement('#gpu-time');
    private apiCallsElement = getElement('#api-calls');
    private drawCallsElement = getElement('#draw-calls');
    private bufferDataElement = getElement('#buffer-data');
    private textureDataElement = getElement('#texture-data');
    private meshesElement = getElement('#meshes');
    private cellsElement = getElement('#cells');
    private renderedCellsElement = getElement('#rendered-cells');
    private instancesElement = getElement('#instances');
    private renderedInstancesElement = getElement('#rendered-instances');
    private verticesElement = getElement('#vertices');
    private renderedVerticesElement = getElement('#rendered-vertices');
    private trianglesElement = getElement('#triangles');
    private renderedTrianglesElement = getElement('#rendered-triangles');
    private showingStatistics = false;

    public constructor() {
        if (DEVELOPMENT) {
            console.log('Statistics UI initialized');
        }
    }

    public update(): void {
        if (!options.isStatistics()) {
            return;
        }
        if (!this.showingStatistics) {
            this.statisticsElement.style.display = 'block';
            this.showingStatistics = true;
            if (DEVELOPMENT) {
                console.log('Statistics UI showed');
            }
        }
        this.updateElements();
    }

    private updateElements(): void {
        this.updateRenderingApi();
        this.updateFpsFrameTime();
        this.updateCpuTime();
        this.updateGpuTime();
        this.updateElement(this.apiCallsElement, 'API calls', 'api-calls');
        this.updateElement(this.drawCallsElement, 'Draw calls', 'draw-calls');
        this.updateBufferData();
        this.updateTextureData();
        this.updateElement(this.meshesElement, 'Meshes', 'meshes');
        this.updateElement(this.cellsElement, 'Cells in range', 'cells');
        this.updateElement(this.renderedCellsElement, 'Rendered cells', 'rendered-cells');
        this.updateElement(this.instancesElement, 'Instances', 'instances');
        this.updateElement(this.renderedInstancesElement, 'Rendered instances', 'rendered-instances');
        this.updateElement(this.verticesElement, 'Vertices', 'vertices');
        this.updateElement(this.renderedVerticesElement, 'Rendered vertices', 'rendered-vertices');
        this.updateElement(this.trianglesElement, 'Triangles', 'triangles');
        this.updateElement(this.renderedTrianglesElement, 'Rendered triangles', 'rendered-triangles');
    }

    private updateRenderingApi(): void {
        this.renderingApiElement.textContent = toStringRenderingApi(rendering.getRenderingApi());
    }

    private updateFpsFrameTime(): void {
        const fps = time.getFps();
        const frameTimeInSeconds = 1 / fps;
        const frameTimeInMilliseconds = secondsToMilliseconds(frameTimeInSeconds);
        const frameTimeString = frameTimeInMilliseconds.toFixed(2);
        this.fpsFrameTimeElement.textContent = `${fps} FPS / ${frameTimeString} ms`;
    }

    private updateCpuTime(): void {
        const cpuTimeString = time.getJsTime().toFixed(2);
        this.cpuTimeElement.textContent = `CPU time: ${cpuTimeString} ms`;
    }

    private updateGpuTime(): void {
        if (rendering.getCapabilities().gpuTimer) {
            const gpuTimeString = time.getGpuTime().toFixed(2);
            this.gpuTimeElement.textContent = `GPU time: ${gpuTimeString} ms`;
        } else {
            this.gpuTimeElement.textContent = '';
        }
    }

    private updateBufferData(): void {
        const bufferDataInBytes = statistics.getValue('buffer-data');
        const bufferDataInMegaBytes = bytesToMegaBytes(bufferDataInBytes);
        const bufferDataString = bufferDataInMegaBytes.toFixed(2);
        this.bufferDataElement.textContent = `Memory in buffers: ${bufferDataString} MB`;
    }

    private updateTextureData(): void {
        const textureDataInBytes = statistics.getValue('texture-data');
        const textureDataInMegaBytes = bytesToMegaBytes(textureDataInBytes);
        const textureDataString = textureDataInMegaBytes.toFixed(2);
        this.textureDataElement.textContent = `Memory in textures: ${textureDataString} MB`;
    }

    private updateElement(element: HTMLDivElement, label: string, key: StatisticKey): void {
        element.textContent = `${label}: ${statistics.get(key)}`;
    }

    public hide(): void {
        this.statisticsElement.style.display = 'none';
        this.showingStatistics = false;
        if (DEVELOPMENT) {
            console.log('Statistics UI hid');
        }
    }
}
