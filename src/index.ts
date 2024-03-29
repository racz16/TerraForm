import { glMatrix } from 'gl-matrix';

import { Entity } from './scene/entity';
import { Options } from './options';
import { StatisticsUi } from './ui/statistics-ui';
import { OptionsUi } from './ui/options-ui';
import { CellsDebugUi } from './ui/cells-debug-ui';
import { Statistics } from './statistics';
import { Time } from './time';
import { Input } from './input';
import { Camera } from './camera';
import { Player } from './player';
import { Rendering } from './rendering/rendering';
import { createVec3 } from './utility';

export let time: Time;
export let options: Options;
export let statistics: Statistics;
export let statisticsUi: StatisticsUi;
export let optionsUi: OptionsUi;
export let cellsDebugUi: CellsDebugUi;
export let input: Input;
export let camera: Camera;
export let player: Player;
export let rendering: Rendering;

export async function main(): Promise<void> {
    try {
        if (PRODUCTION) {
            console.log('This is a production build');
        }
        if (DEVELOPMENT) {
            console.log('This is a development build');
        }
        glMatrix.setMatrixArrayType(Array);
        time = new Time();
        options = new Options();
        statistics = new Statistics();
        statisticsUi = new StatisticsUi();
        cellsDebugUi = new CellsDebugUi();
        optionsUi = new OptionsUi();
        input = new Input();
        camera = new Camera();
        player = new Player();
        rendering = new Rendering();
        await rendering.initialize(createCellEntities);
    } catch (error) {
        console.error(error);
        await rendering.release();
    }
    await createFrame();
}

function createCellEntities(x: number, z: number): Entity[] {
    const scene: Entity[] = [];
    const BOX_COUNT = options.getInstanceCount();
    const CELL_SIZE = options.getCellSize();
    let color = createVec3(Math.random(), Math.random(), Math.random());
    for (let i = 0; i < BOX_COUNT; i++) {
        const entity: Entity = {
            position: createVec3(x + Math.random() * CELL_SIZE - CELL_SIZE / 2, 0.5, z + Math.random() * -CELL_SIZE + CELL_SIZE / 2),
            scale: createVec3(1, 1, 1),
            mesh: 'cube',
            color,
        };
        scene.push(entity);
    }
    color = createVec3(Math.random(), Math.random(), Math.random());
    scene.push({
        position: createVec3(x, 0, z),
        scale: createVec3(CELL_SIZE, 1, CELL_SIZE),
        mesh: 'quad',
        color,
    });
    return scene;
}

export async function createFrame(): Promise<void> {
    time.startFrame();
    player.update();
    await rendering.render();
    time.endFrame();
    requestAnimationFrame(async () => {
        await createFrame();
    });
}

main();
