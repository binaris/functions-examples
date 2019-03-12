const { wrapLambda } = require('./node_modules/lambda-binaris-wrapper/lib/index.js');

const { LAMBDA_FILE_PATH, LAMBDA_HANDLER } = process.env;

exports.handler = wrapLambda(LAMBDA_FILE_PATH, LAMBDA_HANDLER);
