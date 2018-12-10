const SimplexNoise = require('simplex-noise');

const simplex = new SimplexNoise('default');

/**
 * Create a volumetric density field representing the state
 * of a given region of terrain.
 *
 * @param {number} cX - X position of terrain in world coordinates
 * @param {number} cZ - Z position of terrain in world coordinates
 * @param {number} size - length, width and height of the volume to generate
 * @param {number} downscale - how much the noise should be
 *                             reduced (results in more uniform terrain)
 * @param {number} scaleHeight - sets the defacto maxHeight of the volume
 * @return {object} - generated data and metadata
 */
function createDensities(cX, cZ, size, downscale = 1000, scaleHeight = 50) {
  let maxHeight = -1;
  let minHeight = 10000;
  let blockCount = 0;

  let currZ;
  let currHeight;
  let currHeightIndex;
  const heights = new Uint32Array(size * size);
  for (let i = 0; i < size; i += 1) {
    currZ = 0;
    currHeight = 0;
    currHeightIndex = 0;
    const iCX = i + cX;
    const iD = iCX / downscale;
    for (let j = 0; j < size; j += 1) {
      currHeightIndex = i + (j * size);
      currZ = (j + cZ) / downscale;
      // Simplex noise generates in a bounded range of (-1.0) - (+1.0).
      // For volumetric values we need to ensure this stays in the positive range.
      heights[currHeightIndex] = currHeight = ((simplex.noise2D(iD, currZ) + 1.0) / 2.0) * scaleHeight;
      if (currHeight > maxHeight) {
        maxHeight = currHeight;
      } else if (currHeight < minHeight) {
        minHeight = currHeight;
      }
    }
  }
  // if the calculated max height isn't divisible by
  // the volume size granularity, we need to modify it
  // to be an increment of size.
  if (maxHeight % size !== 0) {
    maxHeight = Math.ceil(maxHeight / size) * size;
  }
  const densities = new Int8Array(size * size * maxHeight).fill(1);
  let currIdx = -1;
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < maxHeight; j += 1) {
      for (let k = 0; k < size; k += 1) {
        currIdx = i + (j * size) + (k * maxHeight * size);
        densities[currIdx] = (j <= heights[i + (k * size)]) ? 1 : 0;
        blockCount += densities[currIdx];
      }
    }
  }

  return {
    blockCount,
    data: densities,
    maxHeight,
    minHeight,
  };
}

module.exports = createDensities;
