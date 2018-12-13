import 'babel-polyfill';
import request from 'superagent';

import msleep from './msleep';

import { GEN_SUCCESS, GEN_FAILURE } from './sharedTypes';

// eslint-disable-next-line no-undef
const thisWorker = self;

// time in MS between retries
const timeMSBetweenRetries = 20;

/**
 * Used to generate from a remote Binaris endpoint or the mock
 * local testing server.
 *
 * @param {Number} size - size of tile to generate
 * @param {Number} xPos - xPos of tile to generate
 * @param {Number} zPos - zPos of tile to generate
 * @param {Number} downscale - how much x/z coordinates should
 *    be scaled down for noise generation
 * @param {Number} heightfactor - scalar that limits max block height
 * @param {Boolean} localServer - use local or remote server for generation?
 * @param {Number} numRetries - # of invocation attempts before failing explicitly
 * @param {Number} endpoint - which of the function endpoints to use (if remote gen)
 */
async function genData(ID, size, xPos, yPos, zPos,
  downscale, heightFactor, numTex, endpoint, numRetries = 1) {
  const scaledX = xPos * size;
  const scaledY = yPos * size;
  const scaledZ = zPos * size;
  // TODO(Ry): add exponential backoff
  // For now we simply retry based on the specified number
  // of attempts without exponential backoff or a similar
  // mechanism
  for (let i = 0; i < numRetries; i += 1) {
    try {
      const { body, headers } = await request
        .get(endpoint)
        .query({
          downscale,
          heightFactor,
          numTex,
          size,
          xPos: scaledX,
          yPos: scaledY,
          zPos: scaledZ,
        })
        .responseType('arraybuffer');

      thisWorker.postMessage({
        ID,
        type: GEN_SUCCESS,
        size,
        xPos,
        yPos,
        zPos,
        heightFactor,
        maxHeight: headers['x-gen-data-max-height'],
        blockCount: headers['x-gen-data-blockcount'],
        payloadBytes: headers['x-gen-data-payload-bytes'],
        funcGenTimeMS: headers['x-gen-data-time-running-ms'],
        // TODO(Ry): add ability to change data format
        data: new Int16Array(body),
      });
      break;
    } catch (err) {
      if (i === numRetries - 1) {
        thisWorker.postMessage({
          ID,
          type: GEN_FAILURE,
          size,
          xPos,
          yPos,
          zPos,
          data: err.message,
        });
      } else {
        await msleep(timeMSBetweenRetries);
      }
    }
  }
}

/**
 * Generic event listener that handles all worker events.
 * Instead of having different explicit worker types we
 * instead branch based on type once the event is received.
 */
thisWorker.addEventListener('message', async (e) => {
  const {
    downscale,
    endpoint,
    heightFactor,
    ID,
    numRetries,
    numTex,
    size,
    xPos,
    yPos,
    zPos,
  } = e.data;
  genData(ID, size, xPos, yPos, zPos, downscale, heightFactor, numTex, endpoint, numRetries);
});
