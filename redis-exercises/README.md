# Redis exercises

Before starting any exercises, we highly reccomend familiarizing yourself with Binaris and Redis.

## Create Your Own Binaris Account

All of our exercises are written as Binaris functions, therefore a Binaris account is needed before proceeding. Signing up is quick, painless and doesn't even require a credit card! Binaris offers a hefty free tier on top of it's already low prices so you can code without worrying about the cost.

[Click here to create your free Binaris account!](https://binaris.com/signup)


## Get Your Own Redis Instance

The exercises all assume access to a Redis instance. Knowing that this is impractical for most attendees, we're providing a temporary set of Redis instances.

[Click here to get your Redis instance!](https://replacemewithredisinstance.com)

## Setup your environment for the exercises

Although the content in the exercises is relatively diverse, there are some common requirements.

1. Install the Binaris CLI.

    The command line tool `bn` is used to interface with the Binaris system. [bn](https://github.com/binaris/binaris) is an open source utility we've written to make deploying, invoking and debugging functions enjoyable.

    Installing the tool is easy.

    ```bash
    $ npm install -g binaris
    ```

    Please visit our [Getting Started Docs](https://dev.binaris.com/tutorials/nodejs/getting-started/) or ask a team member if you run into any issues.

    > Note: In the case you don't have `npm` installed visit [the npm downloads page](https://www.npmjs.com/get-npm).


1. Export your Redis credentials as environment variables.

    All exercises expect that the `REDIS_HOST`, `REDIS_PORT` and `REDIS_PASSWORD` variables are exported in your environment. Please refer to [Get Your Own Redis Instance](#get-your-own-redis-instance) if you have yet to receive your credentials.

    ```bash
    $ export REDIS_HOST=public-redis.binaris.io REDIS_PORT=<YOUR_REDIS_PORT> REDIS_PASSWORD=<YOUR_REDIS_PASSWORD>
    ```

    > Note: All Redis instances share the same host but have different ports and passwords.

1. Create a directory for each exercise. 

    Exercises have not been designed to play well together in a flat file structure. Due to this, we highly reccomend creating a separate directory and `package.json` for each exercise.

    ```bash
    $ mkdir name_of_exercise
    $ cd name_of_exercise
    $ npm init -y
    ```


## Exercises
* [Hello Redis with GET and SET](setget)
* [Count Page Views with INCR](pageviews)
* [Track Unique Views with BITFIELD](uniqueviews)
* [Map users with GEORADIUS](geoviews)
* [Managing tasks with LPUSH/LPOP](tasklist)
* [Shopping cart with HSET](shoppingcart)