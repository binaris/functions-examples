# Resize images with ImageMagick (NodeJS)

[ImageMagick](https://imagemagick.org/index.php) is a common super-powerful tool for image manipulation, format conversion, drawing and more. ImageMagick comes pre-installed in the Binaris runtime.

This example shows how to use ImageMagick inside a function to manipulate images.

## Usage

1. Setup Binaris

If you don't already have an account, visit our [Getting Started](https://dev.binaris.com/tutorials/nodejs/getting-started/) page.

2. Deploy to the cloud

```bash
# bn deploy public_resize
```

We use the `public_` prefix to avoid needing an API to authenticate when invoking the function.

3. Invoke

The function expects a URL of an image and optionally the desired size (the default is 32x32). It loads the image, resizes it and returns an HTTP response with the image to the caller.

Functions arguments can be specific in a JSON request body or as query string parameters like so:

```bash
# curl https://run.binaris.com/v2/run/<accountID>/public_resize?url=<imageURL>&sz=<size>
```

Use `bn logs public_resize` to view the logs from your function. Use `bn logs --tail public_resize` to track its execution progress.

## Code

The function's code is fairly simple (see comments inline). We load the image and save it to a local file. Then run [ImageMagick (`convert`)](https://imagemagick.org/script/convert.php) to generated a resized image. Finally, we return an HTTP response with the resized image.

For real production code you probably want to enhance a few aspects of this code:
* Validate the input URL format
* Validate the value of `size`
* Support both `width` and `height` parameters for smarter resizing
* Use request streaming interface to stream the loaded image directly into a file instead of loading it all into memory first (better for larger images)
* Stream the resized image into the HTTP response (this is not yet supported by Binaris)
* Alternatively, avoid writing to file. Various npm packages allow you to call ImageMagick on NodeJs memory buffers.
