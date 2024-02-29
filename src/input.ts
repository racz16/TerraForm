import { optionsUi } from '.';

export class Input {
    private keysDown = new Map<string, KeyboardEvent>();

    public constructor() {
        document.onkeydown = (event) => {
            this.keysDown.set(event.code, event);
        };
        document.onkeyup = (event: KeyboardEvent) => {
            this.keysDown.delete(event.code);
        };
        if (DEVELOPMENT) {
            console.log('Input initialized');
        }
    }

    public isKeyDown(keyCode: string): boolean {
        return !optionsUi.isDialogOpened() && this.keysDown.has(keyCode);
    }
}
