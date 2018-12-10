class Tile {
  constructor(xPos, zPos) {
    this.xPos = xPos;
    this.zPos = zPos;
    this.key = `${this.xPos},${this.zPos}`;
    this.mesh = undefined;
    this.stale = false;
    this.generated = false;
    this.generating = false;
    this.genTime = 0;
    this.genTakenTime = 0;
    this.numBlocks = 0;
  }

  isInBounds(radius, xLoc, zLoc) {
    const realX = Math.abs((this.xPos) - xLoc) <= radius;
    const realZ = Math.abs((this.zPos) - zLoc) <= radius;
    return realX && realZ;
  }

  describe(verbose) {
    if (verbose) {
      const tileData = JSON.stringify({
        x: this.xPos,
        z: this.zPos,
        hasMesh: this.mesh !== undefined,
        generating: this.generating,
        generated: this.generated,
      });
      return `Tile info ${tileData}`;
    }
    return `Tile @ x=${this.xPos} z=${this.zPos}`;
  }
}

function tileKey(x, z) {
  return `${x},${z}`;
}

// TODO(Ry): change tileKey method of usage
module.exports = { Tile, tileKey };
