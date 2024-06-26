import { ReadonlyVec3, glMatrix, mat4, quat, vec3 } from 'gl-matrix';

import { options, rendering } from '.';
import { fovYToFovX } from './utility';
import { getRenderingCapabilities } from './rendering/rendering-context';

export class Camera {
    private static maxFrustumDistance = 0;

    private position = vec3.fromValues(0, 5, 15);
    private rotationY = 0;
    private R = mat4.create();
    private q = quat.create();
    private tempVec = vec3.create();
    private V = mat4.create();
    private P = mat4.create();
    private VP = mat4.create();
    private forward = vec3.create();
    private right = vec3.create();
    private valid = false;

    public static getMaxFrustumDistance(): number {
        return this.maxFrustumDistance;
    }

    public static updateMaxFrustumDistance(): void {
        const fovX = fovYToFovX(options.getFovY());
        this.maxFrustumDistance = options.getViewDistance() / Math.cos(fovX / 2);
    }

    public constructor() {
        Camera.updateMaxFrustumDistance();
    }

    public getPosition(): ReadonlyVec3 {
        return this.position;
    }

    public move(movement: ReadonlyVec3): void {
        vec3.add(this.position, this.position, movement);
        this.valid = false;
    }

    public getRotationY(): number {
        return this.rotationY;
    }

    public rotateY(rotationY: number): void {
        this.rotationY += rotationY;
        this.valid = false;
    }

    public getVP(): mat4 {
        if (!this.valid) {
            this.update();
            this.valid = true;
        }
        return this.VP;
    }

    public getForward(): ReadonlyVec3 {
        if (!this.valid) {
            this.update();
            this.valid = true;
        }
        return this.forward;
    }

    public getRight(): ReadonlyVec3 {
        if (!this.valid) {
            this.update();
            this.valid = true;
        }
        return this.right;
    }

    private update(): void {
        this.updateV();
        this.updateP();
        mat4.mul(this.VP, this.P, this.V);
    }

    private updateV(): void {
        mat4.fromQuat(this.R, quat.fromEuler(this.q, 0, -this.rotationY, 0));
        mat4.translate(this.V, this.R, vec3.negate(this.tempVec, this.position));
        vec3.set(this.forward, this.R[8], this.R[9], -this.R[10]);
        vec3.set(this.right, this.R[0], this.R[1], -this.R[2]);
    }

    private updateP(): void {
        const fovY = glMatrix.toRadian(options.getFovY());
        const canvas = rendering.getCanvas();
        const aspectRatio = canvas.clientWidth / canvas.clientHeight;
        const farPlane = options.getViewDistance();
        if (getRenderingCapabilities().ndcCube) {
            mat4.perspectiveNO(this.P, fovY, aspectRatio, 0.5, farPlane);
        } else {
            mat4.perspectiveZO(this.P, fovY, aspectRatio, 0.5, farPlane);
        }
    }

    public invalidate(): void {
        this.valid = false;
    }
}
