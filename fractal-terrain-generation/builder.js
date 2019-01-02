const fse = require('fs-extra');
const path = require('path');

const YMLUtil = require('binaris/lib/binarisYML');

const { getAccountId, getAPIKey, getRealm } = require('binaris/lib/userConf');
const { forceRealm } = require('binaris/sdk');

const backendYAMLPath = path.join(__dirname, 'fractal_backend');
const servingYAMLPath = path.join(__dirname, 'dist');

async function getServingFuncName() {
  const binarisConf = await YMLUtil.loadBinarisConf(servingYAMLPath);
  return YMLUtil.getFuncName(binarisConf);
}

async function getBackendFuncName() {
  const binarisConf = await YMLUtil.loadBinarisConf(backendYAMLPath);
  return YMLUtil.getFuncName(binarisConf);
}

async function getPublicPath(accountID, endpoint) {
  const savedEndpoint = process.env.BINARIS_INVOKE_ENDPOINT;
  process.env.BINARIS_INVOKE_ENDPOINT = endpoint;
  const { getInvokeUrl } = require('binaris/sdk/url');
  const servingName = await getServingFuncName();
  const invokeURL = await getInvokeUrl(accountID, servingName);
  process.env.BINARIS_INVOKE_ENDPOINT = savedEndpoint;
  return invokeURL;
}

async function getFractalURL(accountID) {
  const { getInvokeUrl } = require('binaris/sdk/url');
  const backendName = await getBackendFuncName();
  return getInvokeUrl(accountID, backendName);
}

async function prebuild() {
  const realm = await getRealm();
  if (realm) {
    forceRealm(realm);
  }
  const accountID = await getAccountId(undefined);
  const FRACTAL_ENDPOINT = await getFractalURL(accountID);
  const PUBLIC_PATH = (await getPublicPath(accountID, ' ')).slice(8);
  return {
    FRACTAL_ENDPOINT,
    PUBLIC_PATH,
    BINARIS_ACCOUNT_ID: accountID,
  };
}

module.exports = { prebuild };
