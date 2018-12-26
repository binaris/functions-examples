# Python3 CRUD + AWS S3 Integration With Functions
Create, Read, Update, and Delete entries in an S3 bucket.

# What does it do?
Creates a simple crud service using only binaris functions written in python3.

# Deploy me!

[Get a Binaris API Key](https://binaris.com/) and an aws account (free trial account available from [Amazon](https://aws.amazon.com/console/) with CLI setup instructions available [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)).

```bash
# Install the Binaris CLI
$ npm install -g binaris

# Set your API key in ~/.binaris.yml
$ bn login

# Clone this repo
$ git clone git@github.com:binaris/functions-examples.git
$ cd python-crud-s3

# Pull the bob repo so you can compile the pip dependencies.
$ git clone git@github.com:binaris/bob.git

# Set the environment variables for deployment
$ export S3_BUCKET_NAME={your-designated-s3-bucket}

# Deploy the functions:
$ ./deploy.sh

# Use the endpoints supplied to create and modify data in s3 using the binaris CLI or curl commands
$ bn invoke create_or_update --data '{"key": "somekey", "object": {someobject}}'
$ curl -H X-Binaris-Api-Key:{your-binaris-api-key} 'https://run.binaris.com/v2/run/{your-account-id}/delete?key=somekey'
```

# Code Style Checks

Proposed changes should adhere to the python [PEP8](https://www.python.org/dev/peps/pep-0008/) style guide, and can be checked using pycodestyle.

```bash
# Install pycodestyle
$ pip3 install pycodestyle

# Run style check on src directory
$ pycodestyle src/
```