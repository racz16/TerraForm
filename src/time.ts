import { statisticsUi } from '.';
import { millisecondsToSeconds } from './utility';

export class Time {
    private static readonly ONE_SECOND = 1000;

    private readonly startMoment = performance.now();
    private lastFrameEndMoment = this.startMoment;
    private frameStartMoment = 0;
    private averageFps = 0;
    private frameCount = 0;
    private currentSecondFrameCount = 0;
    private lastFrameTime = 0;
    private frameTimeSum = 0;
    private averageJsTime = 0;
    private jsTimeSum = 0;

    private averageGpuTime = 0;
    private gpuTimeSum = 0;
    private gpuTimeCount = 0;
    private gpuSecondStartMoment = this.startMoment;

    public addElapsedGpuTime(elapsedTime: number): void {
        const currentMoment = performance.now();
        this.gpuTimeSum += elapsedTime;
        this.gpuTimeCount++;
        if (this.gpuSecondStartMoment + Time.ONE_SECOND < currentMoment) {
            this.averageGpuTime = this.gpuTimeSum / this.gpuTimeCount;
            this.gpuTimeSum = 0;
            this.gpuTimeCount = 0;
            this.gpuSecondStartMoment = currentMoment;
        }
    }

    public startFrame(): void {
        this.frameStartMoment = performance.now();
    }

    public endFrame(): void {
        const currentMoment = performance.now();
        this.jsTimeSum += currentMoment - this.frameStartMoment;
        this.lastFrameTime = currentMoment - this.lastFrameEndMoment;
        this.frameTimeSum += this.lastFrameTime;
        this.lastFrameEndMoment = currentMoment;
        this.frameCount++;
        this.currentSecondFrameCount++;
        if (this.frameTimeSum >= Time.ONE_SECOND) {
            this.averageFps = Math.round((this.currentSecondFrameCount / this.frameTimeSum) * Time.ONE_SECOND);
            this.averageJsTime = this.jsTimeSum / this.currentSecondFrameCount;
            this.jsTimeSum = 0;
            this.frameTimeSum = 0;
            this.currentSecondFrameCount = 0;
            statisticsUi.update();
        }
    }

    public getDeltaTimeFactor(): number {
        return this.lastFrameTime;
    }

    public getFps(): number {
        return this.averageFps;
    }

    public getTimeInMillisecs(): number {
        const currentMoment = performance.now();
        return currentMoment - this.startMoment;
    }

    public getTimeInSecs(): number {
        return millisecondsToSeconds(this.getTimeInMillisecs());
    }

    public getFrameCount(): number {
        return this.frameCount;
    }

    public getJsTime(): number {
        return this.averageJsTime;
    }

    public getGpuTime(): number {
        return this.averageGpuTime;
    }
}
