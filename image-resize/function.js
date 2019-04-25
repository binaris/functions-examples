const cp = require('child_process');
const request = require('request-promise-native');
const file = require('./file');

exports.handler = async (body, context) => {

  // Get an image URL from the request body or query
  // string (useful for invoking directly from a browser)
  const uri = body.url || context.request.query.url;
  if (!uri) {
    // This will be caught by Binaris and returned as
    // a HTTP 500 status code
  	throw new Error('No URL');
  }

  // Get a target size for the image. Image will be
  // resized to {size} by {size} pixels. If neither
  // request body nor query string contains a size
  // value then default to 32
  const size = parseInt(body.sz) || parseInt(context.request.query.sz) || 32;

  // Load the image from the specified url and save
  // to file in /tmp
  console.log(`Loading: ${uri}`);
  const srcimg = await request({
	  uri,
	  method: 'GET',
	  encoding: null,
  });
  console.log(`Image has ${srcimg.length} bytes`);
  await file.write('/tmp/srcimg', srcimg);

  // Use ImageMagick to resize and convert to PNG.
  // Always returning a PNG simplifies the response
  // encoding code below
  let out;
  try {
    console.log(`Resiging to ${size}x${size} pixels`);
    cp.execSync(`convert /tmp/srcimg -resize ${size}x${size} /tmp/dstimg.png`);
  } catch (e) {
    console.error('Error resizing image:');
    console.error(e.stderr.toString());
    console.error(e.stdout.toString());
    throw e;
  }

  // Read the resized image file
  const dstimg = await file.read('/tmp/dstimg.png');

  // Return an HTTP response with PNG encoded binary
  // image
  return new context.HTTPResponse({
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
    },
    body: dstimg,
  });
};
