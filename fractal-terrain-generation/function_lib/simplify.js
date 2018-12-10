/* eslint-disable no-empty */
const NORTH = 0;
const SOUTH = 1;
const EAST = 2;
const WEST = 3;
const TOP = 4;
const BOTTOM = 5;

// Credit to https://0fps.net/2012/06/30/meshing-in-a-minecraft-game/ for
// the theory and code structure for this algorithm.

class Vector3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  sub(other) {
    return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  length() {
    const allSum = (this.x * this.x) + (this.y * this.y) + (this.z * this.z);
    return Math.sqrt(allSum);
  }

  normalize() {
    const len = this.length();
    return new Vector3(this.x / len, this.y / len, this.z / len);
  }

  cross(other) {
    const x_ = (this.y * other.z) - (this.z * other.y);
    const y_ = (this.z * other.x) - (this.x * other.z);
    const z_ = (this.x * other.y) - (this.y * other.x);

    return new Vector3(x_, y_, z_);
  }
}

class BlockFace {
  constructor(type) {
    this.type = type;
    this.sides = [false, false, false, false, false, false];
  }

  equals(face, side) {
    if (this.sides[side] === false || face.sides[side] === false) {
      return false;
    }
    return face.type === this.type;
  }
}

/**
 * Given a volumetric density field attempts to achieve a
 * minimal representation of it's geometry without losing
 * quality. This is done by creating a "total order set"
 * for all the quad arrangements and then chosing the lowest
 * cost ordering. Note this does not actually guarantee that
 * lowest will contain the least quads. The rationale is very
 * similar to the canonical "bin packing" problem"
 *
 * @param {object} volume - the density volume to optimize
 * @param {number} xSize - volumes size in X dimension
 * @param {number} ySize - volumes size in Y dimension
 * @param {number} zSize - volumes size in Z dimension
 * @param {number} xPos - x coordinate offset of geometry
 * @param {number} zPos - z coordinate offset of geometry
 */
function simplify(volume, xSize, ySize, zSize, xPos, zPos) {
  const nX = [0, 0, xSize - 1, 0, 0, 0];
  const nY = [0, 0, 0, 0, ySize - 1, 0];

  const nZ = [zSize - 1, 0, 0, 0, 0, 0];
  const cX = [0, 0, 1, -1, 0, 0];
  const cY = [0, 0, 0, 0, 1, -1];
  const cZ = [1, -1, 0, 0, 0, 0];

  const faces = new Array(xSize * ySize * zSize);
  for (let i = 0; i < volume.length; i += 1) {
    faces[i] = new BlockFace(volume[i]);
  }

  function getBlockData(x, y, z) {
    const sharedIDX = x + (y * xSize) + (z * xSize * ySize);
    return faces[sharedIDX];
  }

  function isEmptyFace(vars, side, x, y, z) {
    return (vars[side] === nX[side] + nY[side] + nZ[side]
       || getBlockData(x + cX[side], y + cY[side], z + cZ[side]).type === 0);
  }

  function getBlockFace(x, y, z, side) {
    const vars = [z, z, x, x, y, y];
    const cullFace = getBlockData(x, y, z);

    if (cullFace === undefined) {
      throw new Error(`No valid neighboring faces found for block x=${x},y=${y},z=${z}`);
    }
    if (isEmptyFace(vars, side, x, y, z)) {
      cullFace.sides[side] = true;
      return cullFace;
    }

    if (getBlockData(x + cX[side], y + cY[side], z + cZ[side]) === undefined) {
      cullFace.sides[side] = true;
      return cullFace;
    }

    cullFace.sides[side] = false;
    return cullFace;
  }

  const verts = [];
  const indices = [];
  let normals = [];
  const tex = [];
  let indexExtend = 0;

  const x = [0, 0, 0];
  const q = [0, 0, 0];
  const du = [0, 0, 0];
  const dv = [0, 0, 0];
  let i;
  let j;
  let k;
  let l;
  let n;
  let w;
  let h;
  let u;
  let v;
  let side;

  let blockFace;
  let blockFace1;
  const mask = new Array(xSize * zSize);

  let b = false;
  let posTraverse = true;
  while (b !== posTraverse) {
    for (let dimTrav = 0; dimTrav < 3; dimTrav += 1) {
      x[0] = 0;
      x[1] = 0;
      x[2] = 0;

      q[0] = 0;
      q[1] = 0;
      q[2] = 0;
      q[dimTrav] = 1;

      u = (dimTrav + 1) % 3;
      v = (dimTrav + 2) % 3;

      if (dimTrav === 0) {
        side = posTraverse ? WEST : EAST;
      } else if (dimTrav === 1) {
        side = posTraverse ? BOTTOM : TOP;
      } else if (dimTrav === 2) {
        side = posTraverse ? SOUTH : NORTH;
      }

      for (x[dimTrav] = -1; x[dimTrav] < xSize;) {
        n = 0;
        for (x[v] = 0; x[v] < ySize; x[v] += 1) {
          for (x[u] = 0; x[u] < xSize; x[u] += 1) {
            blockFace = (x[dimTrav] >= 0) ? getBlockFace(x[0], x[1], x[2], side) : undefined;
            blockFace1 = (x[dimTrav] < xSize - 1) ?
              getBlockFace(x[0] + q[0], x[1] + q[1], x[2] + q[2], side) : undefined;
            // nasty, I know but the simplest/fastest way
            // eslint-disable-next-line no-nested-ternary
            mask[n++] = ((blockFace !== undefined && blockFace1 !== undefined
              && blockFace.equals(blockFace1, side)))
              ? undefined : posTraverse ? blockFace1 : blockFace;
          }
        }

        n = 0;
        x[dimTrav] += 1;

        for (j = 0; j < ySize; j += 1) {
          for (i = 0; i < xSize;) {
            if (mask[n] !== undefined) {
              // just to increment
              for (w = 1; i + w < xSize && mask[n + w] !== undefined
                && mask[n + w].equals(mask[n], side); w += 1) {}

              let done = false;
              for (h = 1; j + h < ySize; h += 1) {
                for (k = 0; k < w; k += 1) {
                  if (mask[n + k + (h * xSize)] === undefined
                    || !mask[n + k + (h * xSize)].equals(mask[n], side)) {
                    done = true;
                    break;
                  }
                }
                if (done) {
                  break;
                }
              }
              if (mask[n].sides[side] && !(mask[n].type === 0)) {
                x[u] = i;
                x[v] = j;
                du[0] = 0;
                du[1] = 0;
                du[2] = 0;
                du[u] = w;

                dv[0] = 0;
                dv[1] = 0;
                dv[2] = 0;
                dv[v] = h;

                let g = posTraverse ? h : w;
                let c = posTraverse ? w : h;

                if (side === 0 || side === 1) {
                  g = w;
                  c = h;
                }

                // 0, 1, 2,
                // 3, 2, 1,

                // v1, v0, v3
                // v2, v3, v0

                // tl, bl, tr
                // br, tr, bl
                // vec v0 is BOTTOM LEFT
                // vec v1 is CORNER
                // vec v2 is CORNER
                // vec v3 is TOP RIGHT


                // v0, v1, v3 then v0 v3 v2


                verts.push(x[0] + xPos); // v0
                verts.push(x[1]);
                verts.push(x[2] + zPos);

                verts.push(x[0] + du[0] + xPos); // v1
                verts.push(x[1] + du[1]);
                verts.push(x[2] + du[2] + zPos);

                verts.push(x[0] + dv[0] + xPos);  // v2
                verts.push(x[1] + dv[1]);
                verts.push(x[2] + dv[2] + zPos);

                verts.push(x[0] + du[0] + dv[0] + xPos); // v3
                verts.push(x[1] + du[1] + dv[1]);
                verts.push(x[2] + du[2] + dv[2] + zPos);

                tex.push(g);
                tex.push(0);
                tex.push(0);
                tex.push(0);
                tex.push(g);
                tex.push(c);
                tex.push(0);
                tex.push(c);

                // v1, v0, v3
                // v2, v3, v0
                if (posTraverse) {
                  indices.push(2 + (indexExtend * 4));
                  indices.push(3 + (indexExtend * 4));
                  indices.push(1 + (indexExtend * 4));
                  indices.push(1 + (indexExtend * 4));
                  indices.push(0 + (indexExtend * 4));
                  indices.push(2 + (indexExtend * 4));
                } else {
                  indices.push(2 + (indexExtend * 4));
                  indices.push(0 + (indexExtend * 4));
                  indices.push(1 + (indexExtend * 4));
                  indices.push(1 + (indexExtend * 4));
                  indices.push(3 + (indexExtend * 4));
                  indices.push(2 + (indexExtend * 4));
                }

                indexExtend += 1;
              }

              for (l = 0; l < h; l += 1) {
                for (k = 0; k < w; k += 1) {
                  mask[n + k + (l * xSize)] = undefined;
                }
              }
              i += w;
              n += w;
            } else {
              i += 1;
              n += 1;
            }
          }
        }
      }
    }
    posTraverse = posTraverse && b;
    b = !b;
  }

  function calcNormals() {
    normals = new Int16Array(verts.length).fill(0);
    for (let idx = 0; idx < indices.length; idx += 3) {
      const i0 = 3 * indices[idx];
      const i1 = 3 * indices[idx + 1];
      const i2 = 3 * indices[idx + 2];

      const baseV0 = new Vector3(verts[i0], verts[i0 + 1], verts[i0 + 2]);
      const baseV1 = new Vector3(verts[i1], verts[i1 + 1], verts[i1 + 2]);
      const baseV2 = new Vector3(verts[i2], verts[i2 + 1], verts[i2 + 2]);
      const v1 = baseV1.sub(baseV0);
      const v2 = baseV2.sub(baseV0);
      const normal = v1.cross(v2).normalize();

      normals[i0] += normal.x;
      normals[i0 + 1] += normal.y;
      normals[i0 + 2] += normal.z;
      normals[i1] += normal.x;
      normals[i1 + 1] += normal.y;
      normals[i1 + 2] += normal.z;
      normals[i2] += normal.x;
      normals[i2 + 1] += normal.y;
      normals[i2 + 2] += normal.z;
    }

    for (let idx = 0; idx < verts.length; idx += 3) {
      const base = new Vector3(normals[idx], normals[idx + 1], normals[idx + 2]);
      const norm = base.normalize();
      normals[idx] = norm.x;
      normals[idx + 1] = norm.y;
      normals[idx + 2] = norm.z;
    }
  }

  calcNormals();

  return {
    verts,
    tex,
    normals,
    indices,
  };
}

module.exports = simplify;
