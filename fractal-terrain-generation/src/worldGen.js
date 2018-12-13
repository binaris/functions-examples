/* eslint-disable no-param-reassign */
import * as THREE from 'three';
import * as log from 'loglevel';

import { WorkerHandle } from './workerPool';
import { Tile, tileKey } from './tile';
import msleep from './msleep';

import { GEN_SUCCESS } from './sharedTypes';

import VertShader from './shaders/simple_shader.vert';
import FragShader from './shaders/simple_shader.frag';

const lightBlueURL = 'https://i.imgur.com/2UV1HBI.png';
const redBrownURL = 'https://i.imgur.com/GbOuHYf.png';
const yellowURL = 'https://i.imgur.com/jWh91a4.png';
const darkBlueURL = 'https://i.imgur.com/nZPDBvc.png';
const orangeURL = 'https://i.imgur.com/rZuJVJY.png';
const limeURL = 'https://i.imgur.com/eU3YGdW.png';
const redURL = 'https://i.imgur.com/4Igsxw0.png';

const loader = new THREE.TextureLoader();
const lightBlueTex = loader.load(lightBlueURL);
const redBrownTex = loader.load(redBrownURL);
const yellowTex = loader.load(yellowURL);
const darkBlueTex = loader.load(darkBlueURL);
const orangeTex = loader.load(orangeURL);
const limeTex = loader.load(limeURL);
const redTex = loader.load(redURL);

const texArray = [
  darkBlueTex, lightBlueTex, limeTex, yellowTex,
  orangeTex, redTex, redBrownTex
];

const numTex = texArray.length;

texArray.forEach((tex) => {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
});

const uniforms = THREE.UniformsUtils.merge([
  THREE.UniformsLib['lights'], {
    textures: {
       type: 'tv',
       value: texArray,
    },
  },
]);

const shaderMat = new THREE.ShaderMaterial({
  uniforms,
  lights: true,
  vertexShader: VertShader,
  fragmentShader: FragShader,
});

// Allow for buffers longer than their type can express
function createGeomFromBuffer(rawData, xPos, yPos, zPos, sizeScalar) {
  log.debug(`generating geom from buffer @pos x "${xPos}" z "${zPos}"`);
  const buffGeom = new THREE.BufferGeometry();
  // eslint-disable-next-line no-bitwise
  const numVerts = rawData[0] + (rawData[1] << 16);
  // eslint-disable-next-line no-bitwise
  const numTex = rawData[2] + (rawData[3] << 16);
  const numMats = numVerts / 3;
  log.trace(`#verts "${numVerts}" #tex "${numTex}"`);
  const bytesPerEle = 2;
  const initOffset = bytesPerEle * 4;
  const vertOff = numVerts * bytesPerEle;
  const vertView = new Int16Array(rawData.buffer, initOffset, numVerts);
  const normView = new Int16Array(rawData.buffer, initOffset + vertOff, numVerts);
  const texView = new Int16Array(rawData.buffer, initOffset + (2 * vertOff), numTex);
  const matsView = new Uint16Array(rawData.buffer, initOffset + (2 * vertOff) + (bytesPerEle * numTex), numMats);
  const indexView = new Uint16Array(rawData.buffer,
    initOffset + (2 * vertOff) + (bytesPerEle * numTex) + (numMats * bytesPerEle));

  buffGeom.addAttribute('position', new THREE.Int16BufferAttribute(vertView, 3));
  buffGeom.addAttribute('normal', new THREE.Float32BufferAttribute(normView, 3, true));
  // TODO(Ry): Get UV coordinates working and enable this
  buffGeom.addAttribute('uv', new THREE.Int16BufferAttribute(texView, 2));
  buffGeom.addAttribute('textureIdx', new THREE.Int16BufferAttribute(matsView, 1));
  buffGeom.setIndex(new THREE.Uint32BufferAttribute(indexView, 1));
  buffGeom.scale(sizeScalar, sizeScalar, sizeScalar);
  return buffGeom;
}

class TileWorld {
  constructor(game, workerPool, materials, radius,
    maxHeight, tileSize, downScale, heightFactor, startX,
    startZ, rootEndpoint, maxGeomGen = 1000, maxEndpoints = 1) {
    this.game = game;
    this.workerPool = workerPool;
    this.materials = materials;
    this.currMaterial = 0;
    this.tileMap = {};
    this.currX = startX;
    this.currZ = startZ;
    this.maxHeight = maxHeight;
    this.radius = radius;
    this.tileSize = tileSize;
    this.downScale = downScale;
    this.heightFactor = heightFactor;
    this.rootEndpoint = rootEndpoint;
    this.sizeScalar = 1;
    this.currEndpoint = 0;
    this.maxEndpoints = maxEndpoints;
    this.inGeomGen = 0;
    this.maxGeomGen = maxGeomGen;
    this.geomSleepTime = 2;
    this.genTimes = {};
    this.inGen = 0;
    this.totalGens = 0;
    this.totalGenTime = 0;
    this.draining = false;
    this.updating = false;
    this.paused = false;
    this.forcedUpdate = true;
    this.runningBlocks = 0;
    this.runningTime = 0;

    /**
     * Called when a task given to a worker either completes or
     * fails.In the case of failure we simply flip the generating
     * bit so the tile can be requeued and generated again.
     *
     * A few improvements are
     *   * Splitting this code into separate file/function. This is
     *     only a bit tricky now because it's dependent on "self"
     *   * Prioritizing failed generations based on proximity to
     *     the origin
     */
    this.workerPool.setWorkersMessageEvent((e) => {
      this.workerPool.releaseWorker(new WorkerHandle(e.data.ID));
      const currTile = this.tileMap[tileKey(e.data.xPos, e.data.yPos, e.data.zPos)];
      if (!currTile) {
        log.warn(`tile ${tileKey(e.data.xPos, e.data.yPos, e.data.zPos)} not valid`);
      }
      if (e.data.type === GEN_SUCCESS) {
        const timeToGen = performance.now() - currTile.genTime;
        currTile.numBlocks = parseInt(e.data.blockCount, 10);
        currTile.genTakenTime = timeToGen;
        this.runningBlocks += currTile.numBlocks;
        this.runningTime += timeToGen;
        this.totalGenTime += timeToGen;
        this.totalGens += 1;
        log.trace(`finished generation for tile at x "${e.data.xPos}" y "${e.data.yPos}" z "${e.data.zPos}"`);
        // now that our worker has finished its task we can pass the raw
        // geometry data to the GPU for rendering
        this.processRawGeom(currTile, e.data);
      } else {
        const { xPos, yPos, zPos, data } = e.data;
        this.inGen -= 1;
        currTile.generating = false;
        log.error(`Tile at x "${xPos}" y "${yPos}" z "${zPos}" failed to generate`);
        log.error(data);
      }
    });
  }

  /**
   * Retrieves the current valid function endpoint number and
   * then increments the value for the next caller.  *
   * Super hacky way to loadbalance. Instead of scaling a single
   * function (which isn't configurable user-side atm) we instead
   * deploy many identical functions and then round robin across
   * the https endpoints.
   */
  getAndIncrementEndpoint() {
    const endpoint = this.currEndpoint % this.maxEndpoints;
    const endpointString = endpoint > 0 ? `${endpoint - 1}` : '';
    this.currEndpoint += 1;
    return `${this.rootEndpoint}${endpointString}/generate`;
  }

  /**
   * Based on the current tile load radius calculate
   * the ID's of new tiles to be loaded. Additionally
   * determine which already loaded tiles are now out
   * of range and remove those from the world map.
   */
  calcTilesToLoad() {
    let currTile;
    const toBeLoaded = [];

    Object.keys(this.tileMap).forEach((keyForTile) => {
      currTile = this.tileMap[keyForTile];
      if (!currTile.isInBounds(this.radius, this.currX, this.currZ)) {
        if (currTile.generated) {
          // check to make sure another event didn't mess with the tiles
          // state while the range was being calculated
          if (!currTile.stale) {
            this.game.removeMesh(keyForTile);
          }
        }

        if (!currTile.generating) {
          log.debug(`deleted ${currTile.describe()}`);
          if (currTile.numBlocks) {
            this.runningBlocks -= currTile.numBlocks;
            this.runningTime -= currTile.genTakenTime;
          }
          delete this.tileMap[keyForTile];
        } else {
          currTile.stale = true;
        }
      } else if (!currTile.generated && !currTile.generating) {
        log.trace(`adding tile ${currTile.describe(true)}`);
        toBeLoaded.push(currTile);
      }
    });
    return toBeLoaded;
  }

  /**
   * Triggers an update of all tiles in the world.
   *
   * @param {number} currX - current origin X location to load around
   * @param {number} currZ - current origin Z location to load around
   */
  updateTiles(currX, currZ) {
    if (!this.paused) {
      const toBeLoaded = this.calcTilesToLoad();
      if (!this.updating && !this.draining) {
        // convert user origin coords into tilespace coords
        const tileX = Math.floor(currX / this.tileSize / this.sizeScalar);
        const tileZ = Math.floor(currZ / this.tileSize / this.sizeScalar);
        if (tileX !== this.currX || tileZ !== this.currZ || this.forcedUpdate) {
          log.debug(`starting world update with origin x=${tileX} z=${tileZ}`);
          this.currX = tileX;
          this.currZ = tileZ;
          this.updating = true;
          this.forcedUpdate = false;
          this.genNewTiles(toBeLoaded);
        }
      }
    } else {
      log.debug('Paused: skipping tile update');
    }
  }

  /**
   * Begin the generation process for all tiles in the
   * provided list.
   *
   * @param {Array} tilesToGen - tiles that need to generated
   */
  genNewTiles(tilesToGen) {
    let newX;
    let newZ;
    let newLoc;
    for (let i = -this.radius; i < this.radius; i += 1) {
      for (let j = 0; j < this.maxHeight; j += 1) {
        for (let k = -this.radius; k < this.radius; k += 1) {
          newX = i + this.currX;
          newZ = k + this.currZ;
          newLoc = tileKey(newX, j, newZ);
          if (!this.tileMap[newLoc]) {
            this.tileMap[newLoc] = new Tile(newX, j, newZ);
            tilesToGen.push(this.tileMap[newLoc]);
          }
        }
      }
    }

    tilesToGen.forEach(async (tile) => {
      this.inGen += 1;
      tile.generating = true;
      this.workerGenTile(tile);
    });
    this.updating = false;
  }

  /**
   * Sends a tile generation task to a currently available worker.
   *
   * @param {object} tile - tile instance to generate data for
   * @param {number} endpoint - numerical endpoint to use for generation
   */
  async workerGenTile(tile) {
    log.trace(`Passing tile gen task to worker using endpoint ${endpoint} for ${tile.describe()}`);
    const handle = await this.workerPool.getAvailableWorker();
    // if we weren't able to get a valid worker or the world is
    // draining cancel the tile generation job
    if (!handle && this.draining) {
      this.inGen -= 1;
      tile.generating = false;
      return;
    }
    const endpoint = this.getAndIncrementEndpoint()
    tile.genTime = performance.now();
    handle.worker.postMessage({
      ID: handle.ID,
      size: this.tileSize,
      downscale: this.downScale,
      heightFactor: (this.maxHeight * this.tileSize),
      numRetries: 5,
      numTex,
      xPos: tile.xPos,
      yPos: tile.yPos,
      zPos: tile.zPos,
      endpoint,
    });
  }

  async processRawGeom(tile, workerData) {
    if (parseInt(workerData.blockCount, 10) === 0) {
      tile.generated = true;
      tile.generating = false;
      this.inGen -= 1;
      return;
    }
    // since this may be one of the few operations
    // on the main thread, care needs to be taken
    // so we avoid blocking
    while (this.inGeomGen >= this.maxGeomGen || this.paused) {
      await msleep(this.geomSleepTime);
    }
    this.inGeomGen += 1;
    const tileGeom = createGeomFromBuffer(workerData.data,
      tile.xPos, tile.yPos, tile.zPos, this.sizeScalar);
    if (!tile.stale) {
      const tileMesh = new THREE.Mesh(tileGeom, shaderMat);
      tileMesh.name = tile.key;
      log.trace(`adding mesh ${tileMesh.name} to scene`);
      this.game.addMesh(tileMesh);
    }
    tileGeom.dispose();
    this.inGeomGen -= 1;
    this.inGen -= 1;
    tile.generated = true;
    tile.generating = false;
  }

  getCurrentMaterial() {
    const mat = this.materials[this.currMaterial % this.materials.length];
    return mat;
  }

  updateMaterials() {
    this.currMaterial += 1;
    const mat = this.materials[this.currMaterial % this.materials.length];
    Object.keys(this.tileMap).forEach((keyForTile) => {
      const tileObj = this.game.getObject(keyForTile);
      if (tileObj) {
        tileObj.material = mat;
        tileObj.material.needsUpdate = true;
      }
    });
  }

  avgGenTime() {
    return this.totalGenTime / this.totalGens;
  }

  avgPerBlockTime() {
    return this.runningTime / this.runningBlocks;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (this.draining) {
      return false;
    }
    this.paused = false;
    return true;
  }

  async drain() {
    this.draining = true;
    const poolDrain = this.workerPool.drain();
    await poolDrain;
    while (this.inGen !== 0 && this.updating);
    const tempRadius = this.radius;
    this.radius = -1;
    if (Object.keys(this.tileMap).length > 0) {
      this.calcTilesToLoad();
      await msleep(10);
    }
    this.radius = tempRadius;
    this.draining = false;
    this.forcedUpdate = true;
  }
}

module.exports = TileWorld;
