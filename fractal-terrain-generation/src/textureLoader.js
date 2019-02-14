import * as THREE from 'three';
import * as log from 'loglevel';

import msleep from './msleep';

const loader = new THREE.TextureLoader();

const modifiedRemoteEndpoint = process.env.FRACTAL_ENDPOINT.replace('fractal', 'servePage');
const resEndpoint = `${process.env.FRACTAL_RESOURCE_ENDPOINT || modifiedRemoteEndpoint}/resources`;

/**
 * Needed as of now because of our rate limiting.
 */
async function loadUntilSuccess(texURL, maxRetries, retryDelay) {
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      return await (new Promise((resolve, reject) => {
        function onLoad(tex) {
          return resolve(tex);
        }
        function onError(err) {
          return reject(err);
        }
        loader.load(texURL, onLoad, undefined, onError);
      }));
    } catch (err) {
      log.debug(`err loading texture ${texURL}, ${err}`);
      await msleep(retryDelay);
    }
  }
  throw new Error(`Unable to load texture ${texURL}`);
}

module.exports = async function loadTextures(texMap, maxRetries, retryDelay) {
  const texArray = [];
  const textureKeys = Object.keys(texMap);
  for (let i = 0; i < textureKeys.length; i += 1) {
    const texKey = textureKeys[i];
    const texURL = `${resEndpoint}/${texMap[texKey]}`;
    texArray.push(await loadUntilSuccess(texURL, maxRetries));
  }

  texArray.forEach((tex) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
  });

  return texArray;
}
