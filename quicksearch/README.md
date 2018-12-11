# Quicksearch With Functions
Fetch textual results as you type with function-based quicksearch.

# What does it do?
1. Index textual data in Redis by uploading JSON to a function endpoint.
1. Super-fast search for textual terms by calling a function endpoint.

# Deploy me!

[Get a Binaris API Key](https://binaris.com/) and a managed Redis instance (which is free from [Redis Labs](www.redislabs.com)).

```bash
# Install the Binaris CLI
$ npm install -g binaris

# Set your API key in ~/.binaris.yml
$ bn login

# Clone this repo.
$ git clone git@github.com:binaris/functions-examples.git
$ cd quicksearch

# Install the function dependencies
$ npm install

# Set the environment variables for deployment
$ export REDIS_HOST={your-redis-host}
$ export REDIS_HOST={your-redis-port}
$ export REDIS_PASSWORD={your-redis-password}

# Deploy the functions:
#   Calls to 'update' require your API Key (taken from ~/.binaris.yml)
#   Calls to 'public_search' require no credentials
$ bn deploy update
$ bn deploy public_search

# Index some sample data
$ bn invoke update -j test/data_1.json

# Set the search function URL in frontend/search.js, with sed or your favourite editor.
# Don't forget to change <your-actual-search-url> to the actual URL from the invoke command!
# You can always recover from a failed attempt with 'git checkout frontend/search.js'
$ sed -i '' s%YOUR_SEARCH_FUNCTION_URL%<your-actual-search-url>% frontend/search.js

# Open the webpage in your browser
frontend/index.html
```

# Why Serverless? Why Binaris?
With classic server architecture, you had to provision and maintain a designated server to handle the webhook calls. If it's   mission-critical, you'd probably need numerous servers in HA constellation and a scale mechanism to handle bursts. You will take care of your infrastructure - from operating system updates and HTTPS certificates to npm vulnerabilities. The server is probably going to be almost 100% idle, but you are going to pay its full price.

With Function as a Service platform, you only handle code, and never pay for idle. All the infrastructure - from operating system to scaling - is done for you.

[Binaris](https://binaris.com/) is a Function as a Service platform with an extremely fast function invocation. This means that you can break your code to multiple functions based on scale, permission and engineering considerations, while keeping the backend quick and responsive. 
