import boto3
import os


def handler(body, req):
    if (req.query is None or req.query['key'] is None):
        raise Exception('Invalid query: missing query param "key"')

    session = boto3.Session(
        aws_access_key_id=os.environ['AWS_ACCESS_KEY'],
        aws_secret_access_key=os.environ['AWS_SECRET_KEY'],
    )
    bucket = os.environ['S3_BUCKET_NAME']
    key = req.query['key']

    s3 = session.resource('s3').Bucket(bucket)
    s3.Object(key=key).delete()
    return 'Object deleted successfully.'
