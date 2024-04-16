import { options, rendering } from '..';
import { Camera } from '../camera';
import { getElement } from '../utility';

type CellDebugState = 'camera' | 'in-frustum' | 'in-range' | 'out-of-range';

export class CellsDebugUi {
    private grid: HTMLDivElement;
    private cellElements: HTMLDivElement[] = [];

    public constructor() {
        this.grid = getElement<HTMLDivElement>('#cells-debugger');
        if (DEVELOPMENT) {
            console.log('Cells debug UI initialized');
        }
    }

    public update(): void {
        while (this.grid.lastChild) {
            this.grid.removeChild(this.grid.lastChild);
        }
        this.cellElements.length = 0;
        if (!options.isCellsDebugger()) {
            return;
        }
        const maxFrustumDistance = Camera.getMaxFrustumDistance();
        const halfGridSize = Math.round(maxFrustumDistance / options.getCellSize()) + 2;
        const gridSize = 2 * halfGridSize + 1;
        this.grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        this.grid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
        this.updateCells(gridSize);
    }

    private updateCells(gridSize: number): void {
        const size = rendering.getCanvas().clientHeight / 3 / gridSize;
        for (let i = 0; i < gridSize * gridSize; i++) {
            const div = document.createElement('div');
            div.style.width = `${size}px`;
            div.style.height = `${size}px`;
            this.grid.appendChild(div);
            this.cellElements.push(div);
        }
    }

    public show(): void {
        this.grid.style.display = 'grid';
        if (DEVELOPMENT) {
            console.log('Cells debug UI showed');
        }
    }

    public hide(): void {
        this.grid.style.display = 'none';
        if (DEVELOPMENT) {
            console.log('Cells debug UI hid');
        }
    }

    public setCellState(index: number, state: CellDebugState): void {
        this.cellElements[index].className = this.getClass(state);
    }

    private getClass(state: CellDebugState): string {
        switch (state) {
            case 'camera':
                return 'camera-cell';
            case 'in-frustum':
                return 'in-frustum-cell';
            case 'in-range':
                return 'in-range-cell';
            case 'out-of-range':
                return 'out-of-range-cell';
        }
    }
}
