import { bytesToMegaBytes, getElement, secondsToMilliseconds } from '../utility';
import { options, rendering, statistics, time } from '..';
import { StatisticKey } from '../statistics';
import { toStringRenderingApi } from '../rendering/rendering';

export class StatisticsUi {
    private statisticsElement: HTMLDivElement;
    private renderingApiElement: HTMLDivElement;
    private fpsFrameTimeElement: HTMLDivElement;
    private cpuTimeElement: HTMLDivElement;
    private gpuTimeElement: HTMLDivElement;
    private apiCallsElement: HTMLDivElement;
    private drawCallsElement: HTMLDivElement;
    private bufferDataElement: HTMLDivElement;
    private meshesElement: HTMLDivElement;
    private cellsElement: HTMLDivElement;
    private renderedCellsElement: HTMLDivElement;
    private instancesElement: HTMLDivElement;
    private renderedInstancesElement: HTMLDivElement;
    private verticesElement: HTMLDivElement;
    private renderedVerticesElement: HTMLDivElement;
    private trianglesElement: HTMLDivElement;
    private renderedTrianglesElement: HTMLDivElement;
    private showingStatistics = false;

    public constructor() {
        this.statisticsElement = getElement('#statistics');
        this.renderingApiElement = getElement('#rendering-api');
        this.fpsFrameTimeElement = getElement('#fps-frame-time');
        this.cpuTimeElement = getElement('#cpu-time');
        this.gpuTimeElement = getElement('#gpu-time');
        this.apiCallsElement = getElement('#api-calls');
        this.drawCallsElement = getElement('#draw-calls');
        this.bufferDataElement = getElement('#buffer-data');
        this.meshesElement = getElement('#meshes');
        this.cellsElement = getElement('#cells');
        this.renderedCellsElement = getElement('#rendered-cells');
        this.instancesElement = getElement('#instances');
        this.renderedInstancesElement = getElement('#rendered-instances');
        this.verticesElement = getElement('#vertices');
        this.renderedVerticesElement = getElement('#rendered-vertices');
        this.trianglesElement = getElement('#triangles');
        this.renderedTrianglesElement = getElement('#rendered-triangles');
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
