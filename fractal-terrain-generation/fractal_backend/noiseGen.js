const SimplexNoise = require('simplex-noise');

const simplex = new SimplexNoise('default');

function getMat(currHeight, maxHeight, numColors) {
  const heightIncr = maxHeight / numColors;
  for (let i = 0; i < numColors; i += 1) {
    if (currHeight <= i * heightIncr) {
      return i;
    }
  }
  return numColors - 1;
}

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
function createDensities(cX, cY, cZ, size, numColors, downscale = 1000, scaleHeight = 50) {
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

  if ((minHeight) > (cY + size)) {
    return {
      blockCount: 0,
      data: [],
      maxHeight,
      minHeight,
    };
  }

  let maxRelevantHeight = maxHeight;
  if (maxHeight > (cY + size)) {
    maxRelevantHeight = size;
  } else {
    maxRelevantHeight = maxHeight - cY;
  }

  const densities = new Int8Array(size * size * size).fill(1);
  let currIdx = -1;
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      for (let k = 0; k < size; k += 1) {
        currIdx = i + (j * size) + (k * size * size);
        densities[currIdx] = ((j + cY) <= heights[i + (k * size)]) ? 1 : 0;
        if (densities[currIdx] !== 0) {
          densities[currIdx] = getMat(j + cY, scaleHeight, numColors);
          blockCount += 1;
        }
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
