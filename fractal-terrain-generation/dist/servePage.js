/* eslint-disable no-console */
const fs = require('mz/fs');
const mime = require('mime-types');
const path = require('path');
const dot = require('dot');

const prefix = '.';
const binarisAccountId = process.env.BINARIS_ACCOUNT_ID;
const dots = dot.process(prefix);

exports.handler = async (body, ctx) => {
  let resourcePath = ctx.request.path;
  console.log(`body ${JSON.stringify(body)}`);
  console.log(`path is ${resourcePath}`);

  if (resourcePath === '/' || resourcePath === undefined) {
    resourcePath = '/index.html';
  }

  let webPage;
  const dotName = resourcePath.substr(1, resourcePath.indexOf('.') - 1);
  if (dots[dotName]) {
    webpage = dots[dotName]({ binarisAccountId });
  } else {
    webpage = await fs.readFile(`${prefix}${resourcePath}`);
  }
  const resourceType = mime.contentType(path.extname(resourcePath));

  return new ctx.HTTPResponse({
    statusCode: 200,
    headers: {
      'Content-Type': resourceType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    },
    body: webpage,
  });
};
