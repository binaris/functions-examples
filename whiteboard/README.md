# Web Whiteboard with Functions
Synchronized web whiteboard based on functions, Redis and websockets.

![Screenshot of two synchronized whiteboards](img/whiteboard-animation-for-readme.gif?raw=true "Screenshot of two synchronized whiteboards")

# How does it work?
1. Binaris Functions are the endpoints that fetch and update the board state from Redis.
1. Websockets send immediate synchronizes updates to all connected clients.

# Deploy me!

## Get some API Keys
1. [Binaris API Key](https://binaris.com/)
1. A Redis instance. A free, managed one is available from [Redis Labs](www.redislabs.com)
1. A [managed websockets account ("channels") from pusher.com](https://pusher.com/channels), which is also free


## Deploy
```bash
# Install the Binaris CLI
$ npm install -g binaris

# Set your API key in ~/.binaris.yml
$ bn login

# Clone this repo
$ git clone git@github.com:binaris/functions-examples.git
$ cd functions-examples/whiteboard

# Install the function dependencies
$ npm install

# Set the environment variables for deployment
$ export BINARIS_ACCOUNT_ID={your-binaris-account-id}
$ export REDIS_HOST={your-redis-host}
$ export REDIS_HOST={your-redis-port}
$ export REDIS_PASSWORD={your-redis-password}
$ export PUSHER_KEY={your-pusher-key}
$ export PUSHER_APP_ID={your-pusher-app-id}
$ export PUSHER_CLUSTER={your-pusher-cluster}
$ export PUSHER_SECRET={your-pusher-secret}

# Deploy the functions:
$ bn deploy public_draw     # Add a new segment to Redis and distribute via websockets
$ bn deploy public_get      # Get all existing segments when a new whiteboard is opened
$ bn deploy public_clear    # Remove all segments
 
 # Set the parameters for the frontend files
$ sed "s/%BINARIS_ACCOUNT_ID%/${BINARIS_ACCOUNT_ID}/;
     s/%PUSHER_KEY%/${PUSHER_KEY}/;
     s/%PUSHER_CLUSTER%/${PUSHER_CLUSTER}/;
     " < frontend/binaris.template.js  > frontend/binaris.js
```

# Run!

Open `frontend/index.html` in a browser window and draw. Now open it again in another window; see how drawing and clearing in one window synchronizes with the other.

# Why Serverless? Why Binaris?
With classical server architecture, it is up to you to provision and maintain a designated server to handle the calls to the whiteboard backend. Since the whiteboard API calls are inherently bursty, you would have to build a scaling policy that can handle the spikes. This causes considerable operational burden - from operating system updates and HTTPS certificates to npm vulnerabilities. The server is probably going to be almost 100% idle, but you are going to pay its full price.

With a Function as a Service platform, you only handle code, and never pay for idle. All the infrastructure - from operating system to scaling - is done for you.

[Binaris](https://binaris.com/) is a Function as a Service platform with extremely fast function invocation. This means that you can break your code to multiple functions based on scale, permission and engineering considerations, while keeping the backend quick and responsive.

![Screenshot of two synchronized whiteboards](img/whiteboard-image-for-readme.png?raw=true "Screenshot of two synchronized whiteboards")
