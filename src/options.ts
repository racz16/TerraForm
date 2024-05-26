import { camera, cellsDebugUi, rendering, statisticsUi } from '.';
import { Camera } from './camera';
import { Cell } from './rendering/cell';

export enum RenderingApiOption {
    AUTO,
    WEBGL_1,
    WEBGL_2,
    WEBGPU,
}

export class Options {
    private renderingApi = RenderingApiOption.AUTO;
    private fovY = 50;
    private viewDistance = 500;
    private cellSize = 100;
    private instanceCount = 100;
    private statistics = false;
    private frustumCulling = true;
    private cellsDebugger = false;

    public constructor() {
        this.loadApi();
        this.loadStatistics();
        this.loadFrustumCulling();
        this.loadCellsDebugger();
        this.loadFovY();
        this.loadViewDistance();
        this.loadCellSize();
        this.loadInstanceCount();
        if (DEVELOPMENT) {
            console.log('Options loaded');
        }
    }

    private loadApi(): void {
        const value = localStorage.getItem('renderingApi');
        if (value == null) {
            return;
        }
        const renderingApi = Number.parseInt(value);
        if (
            renderingApi !== RenderingApiOption.AUTO &&
            renderingApi !== RenderingApiOption.WEBGL_1 &&
            renderingApi !== RenderingApiOption.WEBGL_2 &&
            renderingApi !== RenderingApiOption.WEBGPU
        ) {
            return;
        }
        this.renderingApi = renderingApi;
    }

    private loadStatistics(): void {
        const value = localStorage.getItem('statistics');
        if (value == null) {
            return;
        }
        this.statistics = value === 'true';
    }

    private loadFrustumCulling(): void {
        const value = localStorage.getItem('frustumCulling');
        if (value == null) {
            return;
        }
        this.frustumCulling = value === 'true';
    }

    private loadCellsDebugger(): void {
        const value = localStorage.getItem('cellsDebugger');
        if (value == null) {
            return;
        }
        this.cellsDebugger = value === 'true';
    }

    private loadFovY(): void {
        const value = localStorage.getItem('fovY');
        if (value == null) {
            return;
        }
        this.fovY = Math.min(Math.max(1, +value), 179);
    }

    private loadViewDistance(): void {
        const value = localStorage.getItem('viewDistance');
        if (value == null) {
            return;
        }
        this.viewDistance = Math.max(+value, 1);
    }

    private loadCellSize(): void {
        const value = localStorage.getItem('cellSize');
        if (value == null) {
            return;
        }
        this.cellSize = Math.max(+value, 1);
    }

    private loadInstanceCount(): void {
        const value = localStorage.getItem('instanceCount');
        if (value == null) {
            return;
        }
        this.instanceCount = Math.max(+value, 0);
    }

    public getRenderingApi(): RenderingApiOption {
        return this.renderingApi;
    }

    public setRenderingApi(renderingApi: RenderingApiOption): void {
        this.renderingApi = renderingApi;
        localStorage.setItem('renderingApi', this.renderingApi.toString());
        rendering.recreate();
        camera.invalidate();
        if (DEVELOPMENT) {
            console.log('Rendering API changed');
        }
    }

    public isStatistics(): boolean {
        return this.statistics;
    }

    public setStatistics(statistics: boolean): void {
        this.statistics = statistics;
        localStorage.setItem('statistics', this.statistics.toString());
        if (!statistics) {
            statisticsUi.hide();
        }
        if (DEVELOPMENT) {
            console.log('Statistics enabled/disabled');
        }
    }

    public isFrustumCulling(): boolean {
        return this.frustumCulling;
    }

    public setFrustumCulling(frustumCulling: boolean): void {
        this.frustumCulling = frustumCulling;
        localStorage.setItem('frustumCulling', this.frustumCulling.toString());
        if (DEVELOPMENT) {
            console.log('Frustum culling enabled/disabled');
        }
    }

    public isCellsDebugger(): boolean {
        return this.cellsDebugger;
    }

    public setCellsDebugger(cellsDebugger: boolean): void {
        this.cellsDebugger = cellsDebugger;
        localStorage.setItem('cellsDebugger', this.cellsDebugger.toString());
        cellsDebugUi.recreate();
        if (cellsDebugger) {
            cellsDebugUi.show();
        } else {
            cellsDebugUi.hide();
        }
        if (DEVELOPMENT) {
            console.log('Cells debugger enabled/disabled');
        }
    }

    public getFovY(): number {
        return this.fovY;
    }

    public setFovY(fovY: number): void {
        this.fovY = fovY;
        localStorage.setItem('fovY', this.fovY.toString());
        Camera.updateMaxFrustumDistance();
        cellsDebugUi.recreate();
        camera.invalidate();
        if (DEVELOPMENT) {
            console.log('Field of view changed');
        }
    }

    public getViewDistance(): number {
        return this.viewDistance;
    }

    public setViewDistance(viewDistance: number): void {
        this.viewDistance = viewDistance;
        localStorage.setItem('viewDistance', this.viewDistance.toString());
        Camera.updateMaxFrustumDistance();
        cellsDebugUi.recreate();
        camera.invalidate();
        if (DEVELOPMENT) {
            console.log('View distance changed');
        }
    }

    public getCellSize(): number {
        return this.cellSize;
    }

    public setCellSize(cellSize: number): void {
        this.cellSize = cellSize;
        localStorage.setItem('cellSize', this.cellSize.toString());
        rendering.removeAllCells();
        cellsDebugUi.recreate();
        Cell.updateMaxCellDistance();
        if (DEVELOPMENT) {
            console.log('Cell size changed');
        }
    }

    public getInstanceCount(): number {
        return this.instanceCount;
    }

    public setInstanceCount(instanceCount: number): void {
        this.instanceCount = instanceCount;
        localStorage.setItem('instanceCount', this.instanceCount.toString());
        rendering.removeAllCells();
        if (DEVELOPMENT) {
            console.log('Instance count changed');
        }
    }
}
