export type StatisticKey =
    | 'api-calls'
    | 'draw-calls'
    | 'buffer-data'
    | 'meshes'
    | 'cells'
    | 'rendered-cells'
    | 'instances'
    | 'rendered-instances'
    | 'vertices'
    | 'rendered-vertices'
    | 'triangles'
    | 'rendered-triangles';

export class Statistics {
    private statistics = new Map<StatisticKey, number>();

    public get(key: StatisticKey): string {
        const value = this.statistics.get(key);
        if (value === undefined) {
            return '-';
        }
        return value.toLocaleString();
    }

    public getValue(key: StatisticKey): number {
        return this.statistics.get(key) ?? 0;
    }

    public set(key: StatisticKey, value: number): void {
        this.statistics.set(key, value);
    }

    public increment(key: StatisticKey, value: number): void {
        const newValue = (this.statistics.get(key) ?? 0) + value;
        this.set(key, newValue);
    }
}
