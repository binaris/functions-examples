# Unique Page Views Redis function
## Goal

Create two functions. 

1. A `uniqueView` function should track how many times a webpage has been viewed uniquely. 
1. A `getUniqueViews` should return the total number of unique views.

__Potential Interface__

```bash
$ bn deploy uniqueView
$ bn invoke uniqueView --data '{ "userId": 0 }'
  0
$ bn invoke uniqueView --data '{ "userId": 0 }'
  1
$ bn invoke uniqueView --data '{ "userId": 0 }'
  1
$ bn invoke uniqueView --data '{ "userId": 1 }'
  0
$ bn invoke uniqueView --data '{ "userId": 1 }'
  1
$ bn deploy getUniqueViews
$ bn invoke getUniqueViews
  2
```

<details><summary style='font-size:20px'>Hint</b></summary>

The [BITFIELD](https://redis.io/commands/bitfield) type in Redis can be incredibly efficient and convenient when used to track groups of boolean values.

</details>


<details><summary  style='font-size:20px'>Walkthrough</b></summary>

Let's start by creating the template for our function that tracks unique views to a webpage.

```bash
$ bn create node8 uniqueView
```

Before we can start implementing the logic for `uniqueView`, we should first update the generated `binaris.yml` so the function has access to our Redis credentials at runtime.

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

We utilize `ioredis` package to create a client based on the credentials we just added in our `binaris.yml`.

```diff
> function.js
---
 'use strict';

+const Redis = require('ioredis');

+const client = new Redis({
+  host: process.env.REDIS_HOST,
+  port: process.env.REDIS_PORT,
+  password: process.env.REDIS_PASSWORD,
+});
```

Now, let's create a variable `KEY` which will be used for our `uniqueView` operation.

```diff
> function.js
---
 const client = new Redis({
   host: process.env.REDIS_HOST,
   port: process.env.REDIS_PORT,
   password: process.env.REDIS_PASSWORD,
 });
+ 
+const KEY = 'uniqueViews';
```

It's time to tackle the original problem. How do we store the number of times our function has been uniquely called. In a more full-fledged implementation we might rely on the IP address of the caller, possibly combined with a specific token or ID. But for this exercise, let's keep things simple and require a `userId` body/query parameter explicitly.


```diff
> function.js
---
 exports.handler = async (body, context) => {
+  const userId = context.request.query.userId || body.userId;
-  const name = context.request.query.name || body.name || 'World';
-  return `Hello ${name}!`;
 }
```

It's unimportant to us whether the user provides the ID via the query or body, so we just handle both cases. As you may have guessed, this doesn't guard against someone calling our function without a `userId`.

```diff
> function.js
---
 exports.handler = async (body, context) => {
   const userId = context.request.query.userId || body.userId;
+  if (userId === undefined) {
+    throw new Error('"userId" body/query parameter required!');
+  }
 }
```

Now invocations that do not contain an ID will fail. 

> Note: As you may have noticed, we don't check if the ID provided is a valid integer. As a an extra exercise, try implementing this check yourself!

As a final step for the `uniqueView` function, we need to decide how to use Redis to track these unique values. 

Enter [BITFIELD](https://redis.io/commands/bitfield). Bitfield is a type in Redis that can be incredibly efficient and convenient when used to track groups of boolean values. Effectively, it functions exactly as a boolean array with a fixed length of 2^32. Under the hood, Redis actually uses a single 32 bit string. Each configuration of bits has a unique string representation which can be queried directly.

```diff
> function.js
---
   if (userId === undefined) {
     throw new Error('"userId" body parameter required!');
   }
+
+  return client.setbit(KEY, userId, 1);
};
```

As you can see, using a bitfield is incredibly simple. We simply set index[`userId`] in the bitfield `KEY` to `1` or "viewed".

We're almost done, but we still need a way to retrieve a count of how many unique viewers have called our function. Remedy this, by adding a second function `getUniqueViews` to both our `binaris.yml` and `function.js`

```diff
> binaris.yml
---
     env:
       REDIS_PORT:
       REDIS_HOST:
       REDIS_PASSWORD:
+  getUniqueViews:
+    file: function.js
+    entrypoint: getUniqueViews
+    executionModel: concurrent
+    runtime: node8
+    env:
+      REDIS_PORT:
+      REDIS_HOST:
+      REDIS_PASSWORD:
```

```diff
> function.js
---
   return client.setbit(KEY, userId, 1);
 };
+
+exports.getUniqueViews = async () => {
+  return client.bitcount(KEY);
+};
```

`bitcount`, accesses the `BITFIELD` with name `KEY` and returns the total number of set bits (or in our case unique visitors).

Before we can deploy our new functions we need to install the `ioredis` package we depend on.

```bash
$ npm install ioredis --save
$ bn deploy uniqueView && bn deploy getUniqueViews
```

Let's try it out

```bash
$ bn invoke uniqueView --data '{ "userId": 0 }'
  0
$ bn invoke uniqueView --data '{ "userId": 0 }'
  1
$ bn invoke uniqueView --data '{ "userId": 0 }'
  1
$ bn invoke uniqueView --data '{ "userId": 1 }'
  0
$ bn invoke uniqueView --data '{ "userId": 1 }'
  1
$ bn invoke getUniqueViews
  2
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

const KEY = 'uniqueViews';

exports.uniqueView = async (body, context) => {
  const userId = context.request.query.userId || body.userId;
  if (userId === undefined) {
    throw new Error('"userId" body/query parameter required!');
  }

  return client.setbit(KEY, userId, 1);
};

exports.getUniqueViews = async (body, context) => {
  return client.bitcount(KEY);
}

```

</details>


<details><summary>Final state binaris.yml</summary>

```YAML
functions:
uniqueView:
  file: function.js
  entrypoint: uniqueView
  executionModel: concurrent
  runtime: node8
  env:
    REDIS_PORT:
    REDIS_HOST:
    REDIS_PASSWORD:
getUniqueViews:
  file: function.js
  entrypoint: getUniqueViews
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
$ bn deploy uniqueView
$ bn invoke uniqueView --data '{ "userId": 0 }'
  0
$ bn invoke uniqueView --data '{ "userId": 0 }'
  1
$ bn invoke uniqueView --data '{ "userId": 0 }'
  1
$ bn invoke uniqueView --data '{ "userId": 1 }'
  0
$ bn invoke uniqueView --data '{ "userId": 1 }'
  1
$ bn deploy getUniqueViews
$ bn invoke getUniqueViews
  2
```

</details>
