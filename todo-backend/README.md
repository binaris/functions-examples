# Todo-Backend

[Todo-Backend](https://www.todobackend.com/) is a typical example to showcase backend tech stacks. It defines a simple web API for managing a Todo List.

This sample is an implementation of a Todo-Backend with Binaris functions.

# How does it work?

1. A public function exposes REST API to the outside world
1. A private function uses a Redis Cache instance for the data storage purpose

# Deploy me!

## Get some API Keys
1. [Binaris API Key](https://binaris.com/)
1. A Redis instance. A free, managed one is available from [Redis Labs](www.redislabs.com)

## Deploy
```bash
# Install the Binaris CLI
$ npm install -g binaris

# Set your API key in ~/.binaris.yml
$ bn login

# Clone this repo
$ git clone git@github.com:binaris/functions-examples.git
$ cd functions-examples/todo-backend

# Set the environment variables for deployment
$ export BINARIS_API_KEY={your-binaris-api-key}
$ export REDIS_HOST={your-redis-host}
$ export REDIS_PORT={your-redis-port}
$ export REDIS_PWD={your-redis-password}

# Install the dependencies
$ npm install

# Deploy the functions
$ bn deploy public_TodoBackend
$ bn deploy TodoRedis
```

# Run!

Todo-Backend project has an online test runner which you can point at your own web API and see the tests pass. Open a web browser and navigate to the URL of the following shape (fill in your account number):

`http://todobackend.com/specs/index.html?https://run-sandbox.binaris.com/v2/run/<Your_Account_Number>/public_TodoBackend`

Alternatively, run the front-end of the Todo App (fill in your account number):

`http://todobackend.com/client/index.html?https://run-sandbox.binaris.com/v2/run/<Your_Account_Number>/public_TodoBackend`

# Why Serverless? Why Binaris?

With classic server architecture, you had to provision and maintain a designated server to handle the calls to a demo application similar to Todo-Backend. You take care of your infrastructure - from operating system updates and HTTPS certificates to npm vulnerabilities. The server is probably going to be almost 100% idle, but you are going to pay its full price.

With Function as a Service platform, you only handle code, and never pay for idle. All the infrastructure - from operating system to scaling - is done for you.

[Binaris](https://binaris.com/) is a Function as a Service platform with extremely fast function invocation. This means that you can break your code to multiple functions based on scale, permission and engineering considerations, while keeping the backend quick and responsive.

![Screenshot of Todos](img/todo-backend.png?raw=true "Screenshot of Todos")
