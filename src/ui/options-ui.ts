import { options } from '..';
import { RenderingApiOption } from '../options';
import { getElement } from '../utility';

export class OptionsUi {
    private optionsPanel = getElement<HTMLDivElement>('#options');
    private apiSelector: HTMLSelectElement;
    private opened = false;

    public constructor() {
        this.initializeOpenOptionsButton();
        this.initializeCloseOptionsButton();
        this.apiSelector = this.initializeApiSelector();
        this.initializeFovY();
        this.initializeViewDistance();
        this.initializeCellSize();
        this.initializeInstanceCount();
        this.initializeFullscreen();
        this.initializeStatistics();
        this.initializeFrustumCulling();
        this.initializeCellsDebugger();
        this.addKeyDownListener();
        if (DEVELOPMENT) {
            console.log('Options UI initialized');
        }
    }

    private addKeyDownListener(): void {
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.handleDialogChange(!this.opened);
            }
        });
    }

    private initializeOpenOptionsButton(): void {
        const toggleButton = getElement<HTMLButtonElement>('#toggle-options-button');
        toggleButton.addEventListener('click', () => {
            this.handleDialogChange(!this.opened);
        });
    }

    private initializeCloseOptionsButton(): void {
        const closeButton = getElement<HTMLButtonElement>('#close-options-button');
        closeButton.onclick = () => {
            this.handleDialogChange(false);
        };
    }

    private handleDialogChange(opened: boolean): void {
        this.opened = opened;
        if (this.opened) {
            this.optionsPanel.style.display = 'block';
            if (DEVELOPMENT) {
                console.log('Options UI opened');
            }
        } else {
            this.optionsPanel.style.display = 'none';
            if (DEVELOPMENT) {
                console.log('Options UI closed');
            }
        }
    }

    private initializeApiSelector(): HTMLSelectElement {
        const apiSelector = getElement<HTMLSelectElement>('#rendering-api-selector');
        apiSelector.value = options.getRenderingApi().toString();
        apiSelector.onchange = async () => {
            options.setRenderingApi(+this.apiSelector.value);
        };
        return apiSelector;
    }

    private initializeFovY(): void {
        const fovYInput = getElement<HTMLInputElement>('#fovy-input');
        fovYInput.value = options.getFovY().toString();
        fovYInput.onchange = () => {
            options.setFovY(+fovYInput.value);
        };
    }

    private initializeViewDistance(): void {
        const viewDistanceInput = getElement<HTMLInputElement>('#view-distance-input');
        viewDistanceInput.value = options.getViewDistance().toString();
        viewDistanceInput.onchange = () => {
            options.setViewDistance(+viewDistanceInput.value);
        };
    }

    private initializeCellSize(): void {
        const cellSizeInput = getElement<HTMLInputElement>('#cell-size-input');
        cellSizeInput.value = options.getCellSize().toString();
        cellSizeInput.onchange = () => {
            options.setCellSize(+cellSizeInput.value);
        };
    }

    private initializeInstanceCount(): void {
        const instanceCountInput = getElement<HTMLInputElement>('#instance-count-input');
        instanceCountInput.value = options.getInstanceCount().toString();
        instanceCountInput.onchange = () => {
            options.setInstanceCount(+instanceCountInput.value);
        };
    }

    private initializeFullscreen(): void {
        const fullscreenInput = getElement<HTMLInputElement>('#fullscreen-input');
        fullscreenInput.checked = !!document.fullscreenElement;
        document.addEventListener('fullscreenchange', () => {
            fullscreenInput.checked = !!document.fullscreenElement;
        });
        fullscreenInput.onchange = async () => {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await document.documentElement.requestFullscreen();
            }
        };
    }

    private initializeFrustumCulling(): void {
        const frustumCullingInput = getElement<HTMLInputElement>('#frustum-culling-input');
        frustumCullingInput.checked = options.isFrustumCulling();
        frustumCullingInput.onchange = () => {
            options.setFrustumCulling(frustumCullingInput.checked);
        };
    }

    private initializeCellsDebugger(): void {
        const cellsDebuggerInput = getElement<HTMLInputElement>('#cells-debugger-input');
        cellsDebuggerInput.checked = options.isCellsDebugger();
        cellsDebuggerInput.onchange = () => {
            options.setCellsDebugger(cellsDebuggerInput.checked);
        };
    }

    private initializeStatistics(): void {
        const statisticsInput = getElement<HTMLInputElement>('#statistics-input');
        statisticsInput.checked = options.isStatistics();
        statisticsInput.onchange = () => {
            options.setStatistics(statisticsInput.checked);
        };
    }

    public getSelectedRenderingApi(): RenderingApiOption {
        return Number.parseInt(this.apiSelector.value);
    }

    public isDialogOpened(): boolean {
        return this.opened;
    }
}
