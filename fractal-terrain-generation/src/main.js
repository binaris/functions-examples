/* eslint-disable no-param-reassign */
import * as THREE from 'three';
import * as dat from 'dat.gui';
import * as log from 'loglevel';

import { Game } from './game';
import TileWorld from './worldGen';
import { WorkerPool } from './workerPool';

const rootEndpoint = `${process.env.FRACTAL_ENDPOINT}`;

const defaultTileSize = 4;
const defaultTileRadius = 8;
const defaultNumWorkers = 1;
const defaultNumFunctions = 1;

const guiOptions = {
  tileSize: defaultTileSize,
  tileRadius: defaultTileRadius,
  numWorkers: defaultNumWorkers,
  numFunctions: defaultNumFunctions,
  DynamicGen: true,
  skyboxColor: '#ffffff',
  wireframe: false,
  pause: false,
};

const currPos = { x: 0, z: 0 };

const mats = [
  new THREE.MeshNormalMaterial({
    side: THREE.FrontSide,
  }),
  new THREE.MeshNormalMaterial({
    side: THREE.FrontSide,
    wireframe: true,
  }),
];

/**
 * Setup the GUI menus for the demo, including control board
 * and diagnostic info
 *
 * @param {object} gui - the dat gui instance to attach items to
 * @param {object} world - the TileWorld instance that feeds the GUI info
 * @param {object} game - the ThreeJS game instance
 */
function setupGUIMenus(gui, world, game) {
  /**
   * Allows GUI element values to be forcibly changed back
   * in the case that the desired value clashes with world
   * generation constraints.
   */
  function forceElementValue(eleName, value) {
    for (let i = 0; i < gui.__controllers.length; i += 1) {
      if (gui.__controllers.property === eleName) {
        gui.__controllers[i].setValue(value);
      }
    }
  }

  const fullOptions = Object.assign({}, guiOptions);

  fullOptions.reset = async () => {
    // TODO(Ry): make sure all tracked vars in worldGen are reset
    await world.drain();
  };

  gui.add(fullOptions, 'reset');

  const pauseDisplay = document.getElementById('pause-popup');
  const pauseEle = gui.add(fullOptions, 'pause');
  pauseEle.onChange((value) => {
    if (value === true) {
      world.pause();
      pauseDisplay.style.display = 'block';
    } else {
      const resumed = world.resume();
      if (!resumed) {
        forceElementValue('pause', false);
      } else {
        pauseDisplay.style.display = 'none';
      }
    }
  });

  const dynamicGenEle = gui.add(fullOptions, 'DynamicGen');

  dynamicGenEle.onChange((value) => {
    if (value === true) {
      guiOptions.DynamicGen = true;
    } else {
      guiOptions.DynamicGen = false;
    }
  });

  // update the size of each individual tile
  const tileSizeEle = gui.add(fullOptions, 'tileSize').min(1).max(8).step(1);
  tileSizeEle.onChange(async (value) => {
    log.trace(`new tile size is ${2 ** value}`);
    await world.drain();
    world.tileSize = 2 ** value;
    world.heightFactor = world.tileSize * 0.8;
    world.forcedUpdate = true;
  });

  // update the tile generation radius
  const tileRadiusEle = gui.add(fullOptions, 'tileRadius').min(0).max(100).step(1);
  tileRadiusEle.onChange((value) => {
    log.trace(`new tile radius is ${value}`);
    world.radius = value;
    world.forcedUpdate = true;
  });

  // update the num of Webtask workers the frontend should use
  const numWorkersEle = gui.add(fullOptions, 'numWorkers').min(1).max(16).step(1);
  numWorkersEle.onChange(async (value) => {
    if (value === world.workerPool.numWorkers) {
      log.info('value is unchanged');
      return;
    }
    if (world.workerPool.changeNumWorkers(value)) {
      log.info(`new number of workers is ${value}`);
    } else {
      forceElementValue('numWorkers', world.workerPool.numWorkers);
      log.info('worker count failed to update because the pool is already being resized');
    }
  });

  const numFunctionsEle = gui.add(fullOptions, 'numFunctions').min(1).max(7).step(1);
  numFunctionsEle.onChange(async (value) => {
    if (value === world.maxEndpoints) {
      log.info('value is unchanged');
      return;
    }
    world.maxEndpoints = value;
    log.info(`new number of endpoints is ${value}`);
  });

  // enable/disable wireframe rendering
  const wireframeEle = gui.add(fullOptions, 'wireframe');
  wireframeEle.onChange(() => {
    world.updateMaterials();
  });

  // choose from accepted values
  const skyboxEle = gui.addColor(fullOptions, 'skyboxColor');
  skyboxEle.onChange((value) => {
    log.trace(`new skybox color is ${value}`);
    game.setBackgroundColor(new THREE.Color(value));
  });
}

/**
 * Configures a base datGUI and load any existing GUI state
 * from user localstorage.
 *
 * @param {object} gui - given a dat GUI instance loads existing
 *                       state
 * @return {object} - the config of the last session (if it exists)
 */
function createGUI(gui) {
  const preset = gui.getSaveObject().preset;
  const savedData = gui.getSaveObject().remembered;

  const savedConfig = guiOptions;
  if (savedData) {
    Object.keys(savedConfig).forEach((key) => {
      savedConfig[key] = savedData[preset][0][key] || savedConfig[key];
    });
  }
  gui.remember(savedConfig);
  return savedConfig;
}

/**
 * Setup the full demo by creating/configuring our UI and
 * initializing the world with given parameters.
 *
 * @return {object} - the fully configured game instance
 */
function setupDemo() {
  const gui = new dat.gui.GUI();
  const savedConfig = createGUI(gui);

  const game = new Game();
  const { numWorkers, numFunctions, tileSize,
    tileRadius, skyboxColor } = savedConfig;
  const pool = new WorkerPool(numWorkers, 1);

  // currently a hack which is used to "fake" concurrency
  const downScale = 80;
  const heightFactor = (2 ** tileSize) * 0.8;
  const maxHeight = 3;

  const world = new TileWorld(game, pool, mats,
    tileRadius, maxHeight, 2 ** tileSize, downScale,
    heightFactor, 0, 0, rootEndpoint, 1000, numFunctions);

  // ADD GENS PER SECOND
  game.setBackgroundColor(new THREE.Color(skyboxColor));
  const totalBlocksEle = document.getElementById('totalBlocks');
  const totalBlocksNode = document.createTextNode('');
  totalBlocksEle.append(totalBlocksNode);

  const avgBlockGenTimeEle = document.getElementById('avgBlockGenTime');
  const avgBlockGenTimeNode = document.createTextNode('');
  avgBlockGenTimeEle.append(avgBlockGenTimeNode);

  game.addUpdateProcedure('update tiles', async (delta, cameraPos) => {
    if (guiOptions.DynamicGen) {
      currPos.x = cameraPos.x;
      currPos.z = cameraPos.z;
    }

    world.updateTiles(currPos.x, currPos.z);
    totalBlocksNode.nodeValue = world.runningBlocks;
    avgBlockGenTimeNode.nodeValue = `${(world.avgPerBlockTime() * 1000).toFixed(2)}us`;
  }, 0.1);

  game.addUpdateProcedure('print position', (delta, cameraPos) => {
    log.trace(`camera pos: ${JSON.stringify(cameraPos)}`);
  }, 40);

  function onDocumentKeyDown(event) {
    const keyCode = event.which;
    if (keyCode === 77) {
      world.updateMaterials();
    }
    if (keyCode === 82) {
      world.drain();
    }
  }

  // eslint-disable-next-line no-undef
  document.addEventListener('keydown', onDocumentKeyDown, false);
  setupGUIMenus(gui, world, game);
  return game;
}

const game = setupDemo();

game.animate();
