./bob/build.sh 3

export AWS_ACCESS_KEY=$(aws configure get aws_access_key_id)
export AWS_SECRET_KEY=$(aws configure get aws_secret_access_key)

bn deploy create_or_update
bn deploy read
bn deploy delete