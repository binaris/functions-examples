import boto3
import json
import os


def handler(body, req):
    if (body is None or body['key'] is None or body['object'] is None):
        raise Exception('Invalid request body.')

    session = boto3.Session(
        aws_access_key_id=os.environ['AWS_ACCESS_KEY'],
        aws_secret_access_key=os.environ['AWS_SECRET_KEY'],
    )
    bucket = os.environ['S3_BUCKET_NAME']
    key = body['key']
    s3_file = body['object']

    s3 = session.resource('s3').Bucket(bucket)
    s3.Object(key=key).put(Body=json.dumps(s3_file))
    return 'File available at bucket %s with key %s' % (bucket, key)
