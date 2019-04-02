# Set/Get Redis functions
## Goal

Create two functions that will showcase how Redis can be utilized on Binaris.
 
1. A `setName` function which takes in a "name" from the user and stores it in a well-known Redis key.
1. A `getName` function which retrieves the "name" from redis and returns it in a response of your choosing

__Potential Interface__

`setName` function
```bash
$ bn invoke setName --data '{ "name": "Bob" }'
  'ok'
```

`getName` function
```bash
$ bn invoke getName
  'Hello Bob!'
```

<details><summary  style='font-size:20px'>Walkthrough</b></summary>

We know that we need to create two functions, one for setting our name and another for getting that name. With this in mind, let's start by creating our `setName` function.

```bash
$ bn create node8 setName
```

Before we can start implementing the logic to a set a name, we should first update the generated `binaris.yml` so the function has access to our Redis credentials at runtime.

```diff
> binaris.yml
---
     executionModel: concurrent
     runtime: node8
+    env:
+      REDIS_PORT:
+      REDIS_HOST:
+      REDIS_PASSWORD:
```

<details><summary>About "env"</b></summary>

> Functions declared in your `binaris.yml` can specify keys & values that should be available as env variables when the function is invoked. When a key is specified but the value is omitted, `bn deploy` will attempt to inject a local environment variable with the key name. For more info visit our [docs](https://github.com/binaris/binaris#storing-secrets-and-other-configuration-parameters).

</details>

Next, let's jump into the code.

We need a method of communicating with Redis from our function. This could be accomplished using RESP(REdis Serialization Protocol) over TCP, but fortunately the [ioredis](https://www.npmjs.com/package/ioredis) npm package is available to save us time.

```diff
> function.js
---
 'use strict';

+const Redis = require('ioredis');
```

Next, we utilize `ioredis` to create a client based on the credentials we just added in our `binaris.yml`.


```diff
> function.js
---
 const Redis = require('ioredis');

+const client = new Redis({
+  host: process.env.REDIS_HOST,
+  port: process.env.REDIS_PORT,
+  password: process.env.REDIS_PASSWORD,
+});
```

> Note: By creating our Redis client at the file scope, we guarantee that a single client will be used for all subsequent invocations.

Now, let's create a variable `KEY` which will be used for our `setName` operation.


```diff
> function.js
---
 const client = new Redis({
   host: process.env.REDIS_HOST,
   port: process.env.REDIS_PORT,
   password: process.env.REDIS_PASSWORD,
 });
+ 
+const KEY = 'name';
```

Finally, let's modify the auto-generated `exports.handler` to `set` the input value at `KEY`.

```diff
> function.js
---
 exports.handler = async (body, context) => {
   const name = context.request.query.name || body.name || 'World';
+  await client.set(KEY, name);
-  return `Hello ${name}!`;
+  return 'ok';
 };
```

`setName` is a done deal. Now we need a way to retrieve a previously set name. Let's go back to our `binaris.yml` and add a second function `getName`.

```diff
> binaris.yml
---
     env:
       REDIS_PORT:
       REDIS_HOST:
       REDIS_PASSWORD:
+  getName:
+    file: function.js
+    entrypoint: getName
+    executionModel: concurrent
+    runtime: node8
+    env:
+      REDIS_PORT:
+      REDIS_HOST:
+      REDIS_PASSWORD:
```

> Note: Because we have two Binaris functions defined in the same file our "getName" can't use "handler" as the entrypoint.

As a final change to our `function.js`, we'll add our `getName` handler.

```diff
> function.js
---
   await client.set(KEY, name);
   return 'ok';
 };
+
+exports.getName = async (body) => {
+  const name = await client.get(KEY);
+  return `Hello ${name}`;
+};
```

Before we can deploy our new functions we need to install the `ioredis` package we depend on.

```bash
$ npm install ioredis --save
$ bn deploy setName && bn deploy getName
```

Let's try it out

```bash
$ bn invoke setName --data '{ "name": "Bob" }'
  'ok'
$ bn invoke getName
  'Hello Bob!'
```

<details><summary>Final state function.js</summary>


```JavaScript
'use strict';

const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const KEY = 'name';

exports.handler = async (body, context) => {
  const name = context.request.query.name || body.name || 'World';
  await client.set(KEY, name);
  return 'ok';
};

exports.getName = async (body) => {
  const name = await client.get(KEY);
  return `Hello ${name}`;
};
```

</details>


<details><summary>Final state binaris.yml</summary>

```YAML
functions:
  setName:
    file: function.js
    entrypoint: handler
    executionModel: concurrent
    runtime: node8
    env:
      REDIS_PORT:
      REDIS_HOST:
      REDIS_PASSWORD:
  getName:
    file: function.js
    entrypoint: getName
    executionModel: concurrent
    runtime: node8
    env:
      REDIS_PORT:
      REDIS_HOST:
      REDIS_PASSWORD:
```

</details>


</details>


<details><summary  style='font-size:20px'>Skip it all</b></summary>

```bash
$ bn deploy setName && bn deploy getName
$ bn invoke setName --data '{ "name": "Bob" }'
  'ok'
$ bn invoke getName
  'Hello Bob!'
```

</details>



<details><summary  style='font-size:20px'>Stretch Goal</b></summary>

Instead of specifically setting the "name" key, create set and get functions which allow the invoker to specify a key

__Potential Interface__

`set` function
```bash
$ bn invoke set --data '{ "key": "name", "value": "Jim" }'
  'Jim'
```

`get` function
```bash
$ bn invoke get --data '{ "key": "name" }'
  'Hello Jim!'
```

</details>

<div align="center"><a href="../redis-exercises#exercises">List of Exercises</a></div>
<div align="right"><a href="../pageviews#pageview-redis-function">Next Exercises</a></div>

