import numpy as np
import urllib2, cStringIO
import io

from PIL import Image
from sklearn.cluster import KMeans
from sklearn.metrics import pairwise_distances_argmin
from sklearn.datasets import load_sample_image
from sklearn.utils import shuffle

# This function utilizes a modified version of the scikit-learn example available here
#
# https://scikit-learn.org/stable/auto_examples/cluster/plot_color_quantization.html
test_image = 'https://i.imgur.com/DUSZHiX.jpg'

# num_colors == num_clusters
default_number_colors = 64

def as_image(np_data):
    # bring the data back into the 0 - 255 RGB range
    return Image.fromarray((np_data * 255).astype('uint8'))

def get_image_bytes(data, image_format):
    intermediate = as_image(data)

    with io.BytesIO() as output:
        intermediate.save(output, format=image_format)
        return output.getvalue()

def recreate_image(codebook, labels, w, h):
    d = codebook.shape[1]
    image = np.zeros((w, h, d))
    label_idx = 0
    for i in range(w):
        for j in range(h):
            image[i][j] = codebook[labels[label_idx]]
            label_idx += 1
    return image

def compress_image(image_url, num_colors):
    file = cStringIO.StringIO(urllib2.urlopen(image_url).read())

    # All elements are divided by 255 so their values are brought into
    # a normalized RGB range.
    raw_img = Image.open(file)
    proper_img = np.array(Image.open(file).convert('RGB'), dtype=np.float64) / 255
    proper_img = np.float32(proper_img)

    w, h, d = original_shape = tuple(proper_img.shape)
    assert d == 3
    image_array = np.reshape(proper_img, (w * h, d))

    image_array_sample = shuffle(image_array, random_state=0)[:1000]
    kmeans = KMeans(n_clusters=num_colors, random_state=0).fit(image_array_sample)
    labels = kmeans.predict(image_array)

    # use our output clustering to reconstruct the image with a reduce pallete
    return recreate_image(kmeans.cluster_centers_, labels, w, h)

def handler(body, ctx):
    query = ctx.request.query
    image_url = query['image_url']
    # try and use the num_colors query param if it exists
    num_colors = int(query['num_colors']) if ('num_colors' in query) else default_number_colors

    image_data = compress_image(image_url, num_colors)
    # we always save as "png" to avoid losing data
    image_bytes = get_image_bytes(image_data, 'PNG')

    # we want the image to display in the browser which is
    # why a specific 'Content-Type' is returned
    return ctx.HTTPResponse(status_code=200,
        headers={ 'Content-Type': 'image/png' }, body=image_bytes)

# allow local testing with a sample image
if __name__ == '__main__':
    image_data = compress_image(test_image, default_number_colors)
    intermediate = as_image(image_data)
    intermediate.save('output.png')
