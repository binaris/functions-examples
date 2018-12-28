# Python3 CRUD + Google Spreadsheet Integration With Functions
Create, Read, Update, and Delete entries using a google spreadsheet for storage

# What does it do?
Creates a simple crud service using only binaris functions written in python3.

# Deploy me!

[Get a Binaris API Key](https://binaris.com/) and a google [project + credentials](https://gspread.readthedocs.io/en/latest/oauth2.html) and a usable [spreadsheet](https://sheets.new) from Google Docs.

```bash
# Install the Binaris CLI
$ npm install -g binaris

# Set your API key in ~/.binaris.yml
$ bn login

# Clone this repo
$ git clone git@github.com:binaris/functions-examples.git
$ cd python-crud-google-spreadsheet

# After cloning the repo, move your credentials into the repo working directory
$ cp {path-to-credentials} ./credentials.json

# Pull the bob repo so you can compile the pip dependencies.
$ git clone git@github.com:binaris/bob.git

# Set the environment variables for deployment
# The spreadsheet id can be located in the spreadsheet url
$ export SPREADSHEET_ID={your-designated-spreadsheet-id}

# Deploy the functions:
$ ./deploy.sh

# Use the endpoints supplied to create, read, and modify data in the sheet using the binaris CLI or curl commands
$ bn invoke create --data '{"values": [1, 2, 3, 4, 5]}'
$ curl -H X-Binaris-Api-Key:{your-binaris-api-key} 'https://run.binaris.com/v2/run/{your-account-id}/delete?key={row-number}'
```

# Code Style Checks

Proposed changes should adhere to the python [PEP8](https://www.python.org/dev/peps/pep-0008/) style guide, and can be checked using pycodestyle.

```bash
# Install pycodestyle
$ pip3 install pycodestyle

# Run style check on src directory
$ pycodestyle src/
```