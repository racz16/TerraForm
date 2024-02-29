import { vec3 } from 'gl-matrix';

import { camera, input, time } from '.';

export class Player {
    private static readonly MOVE_SPEED = 0.025;
    private static readonly ROTATION_SPEED = 0.075;

    private movement = vec3.create();

    public update(): void {
        const deltaTime = time.getDeltaTimeFactor();
        this.updateTranslation(deltaTime);
        this.updateRotation(deltaTime);
    }

    private updateTranslation(deltaTime: number): void {
        const speedMultiplier = input.isKeyDown('ShiftLeft') ? 10 : 1;
        const speed = Player.MOVE_SPEED * deltaTime * speedMultiplier;
        const forward = camera.getForward();
        const right = camera.getRight();
        vec3.set(this.movement, 0, 0, 0);
        let moved = false;
        if (input.isKeyDown('KeyA')) {
            vec3.subtract(this.movement, this.movement, right);
            moved = true;
        }
        if (input.isKeyDown('KeyD')) {
            vec3.add(this.movement, this.movement, right);
            moved = true;
        }
        if (input.isKeyDown('KeyW')) {
            vec3.add(this.movement, this.movement, forward);
            moved = true;
        }
        if (input.isKeyDown('KeyS')) {
            vec3.subtract(this.movement, this.movement, forward);
            moved = true;
        }
        if (moved) {
            vec3.scale(this.movement, vec3.normalize(this.movement, this.movement), speed);
            camera.move(this.movement);
        }
    }

    private updateRotation(deltaTime: number): void {
        const speed = Player.ROTATION_SPEED * deltaTime;
        let rotation = 0;
        if (input.isKeyDown('KeyQ')) {
            rotation += speed;
        }
        if (input.isKeyDown('KeyE')) {
            rotation -= speed;
        }
        if (rotation !== 0) {
            camera.rotate(rotation);
        }
    }
}
