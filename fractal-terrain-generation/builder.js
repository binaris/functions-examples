const replace = require('replace-in-file');
const fse = require('fs-extra');
const path = require('path');

const YMLUtil = require('binaris/lib/binarisYML');

const { getAccountId, getAPIKey } = require('binaris/lib/userConf');

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
  process.env.BINARIS_INVOKE_ENDPOINT = endpoint;
  const { getInvokeUrl } = require('binaris/sdk/url');
  const servingName = await getServingFuncName();
  const savedEndpoint = process.env.BINARIS_INVOKE_ENDPOINT;
  const invokeURL = await getInvokeUrl(accountID, servingName);
  process.env.BINARIS_INVOKE_ENDPOINT = savedEndpoint;
  return invokeURL;
}

async function getFractalURL(accountID) {
  const { getInvokeUrl } = require('binaris/sdk/url');
  const backendName = await getBackendFuncName();
  return getInvokeUrl(accountID, backendName);
}

async function replaceHTMLAccountID(accountID) {
  const templatePath = path.join(__dirname, 'template.html');
  const destPath = path.join(__dirname, 'dist', 'index.html');
  await fse.copy(templatePath, destPath, { overwrite: true, errorOnExist: false });

  const options = {
    files: destPath,
    from: /<BINARIS_ACCOUNT_NUMBER>/g,
    to: accountID,
  };
  await replace(options)
}

async function prebuild() {
  const accountID = await getAccountId(undefined);
  await replaceHTMLAccountID(accountID);
  const FRACTAL_ENDPOINT = await getFractalURL(accountID);
  const PUBLIC_PATH = (await getPublicPath(accountID, ' ')).slice(8);
  return {
    FRACTAL_ENDPOINT,
    PUBLIC_PATH,
  };
}

module.exports = { prebuild };
