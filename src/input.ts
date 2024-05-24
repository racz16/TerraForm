import { optionsUi } from '.';

export class Input {
    private keysDown = new Map<string, KeyboardEvent>();

    public constructor() {
        window.addEventListener('blur', () => {
            this.keysDown.clear();
        });
        window.addEventListener('keydown', (event) => {
            this.keysDown.set(event.code, event);
        });
        window.addEventListener('keyup', (event) => {
            this.keysDown.delete(event.code);
        });
        if (DEVELOPMENT) {
            console.log('Input initialized');
        }
    }

    public isKeyDown(keyCode: string): boolean {
        return !optionsUi.isDialogOpened() && this.keysDown.has(keyCode);
    }
}
