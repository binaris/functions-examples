const { exec } = require('child_process');
const { readFile, writeFile } = require('fs');
const { promisify } = require('util');
const request = require('request-promise-native');

const asyncExec = promisify(exec);
const asyncReadFile = promisify(readFile);
const asyncWriteFile = promisify(writeFile);

const randomString = () => Math.random().toString(36).substring(2, 15);

exports.handler = async (body, context) => {
  // Get an image URL from the request body or query
  // string (useful for invoking directly from a browser)
  const uri = body.url || context.request.query.url;
  if (uri === undefined || uri === '') {
    // This will be caught by Binaris and returned as
    // a HTTP 500 status code
    throw new Error('No URL');
  }

  // Get a target size for the image. Image will be
  // resized to {size} by {size} pixels. If neither
  // request body nor query string contains a size
  // value then default to 32
  const size = parseInt(body.sz, 10) ||
               parseInt(context.request.query.sz, 10) ||
               32;

  const srcFile = `/tmp/${randomString()}`;
  const dstFile = `/tmp/${randomString()}.png`;

  // Load the image from the specified url and save
  // to file in /tmp
  console.log(`Loading: ${uri}`);
  const srcImage = await request({ uri, encoding: null });
  console.log(`Image has ${srcImage.length} bytes`);
  await asyncWriteFile(srcFile, srcImage);

  // Use ImageMagick to resize and convert to PNG.
  // Always returning a PNG simplifies the response
  // encoding code below
  try {
    console.log(`Resiging to ${size}x${size} pixels`);
    await asyncExec(`convert ${srcFile} -resize ${size}x${size} ${dstFile}`);
  } catch (e) {
    console.error('Error resizing image:');
    console.error(e.stderr.toString());
    console.error(e.stdout.toString());
    throw e;
  }

  // Read the resized image file
  const dstImage = await asyncReadFile(dstFile);

  // Return an HTTP response with PNG encoded binary
  // image
  return new context.HTTPResponse({
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
    },
    body: dstImage,
  });
};
