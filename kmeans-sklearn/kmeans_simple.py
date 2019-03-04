from sklearn import cluster, datasets

iris = datasets.load_iris()
X_iris = iris.data
y_iris = iris.target
k_means = cluster.KMeans(n_clusters=5)
k_means.fit(X_iris)

def handler(body, req):
    # just return our labels
    return k_means.labels_.tolist()
