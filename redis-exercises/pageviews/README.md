# Pageview Redis function
## Goal

Create a function that will be called each time a webpage is viewed. Therefore, the pageview count should equal the number of invocations.

__Potential Interface__

```bash
# first deployment of "viewPage"
$ bn deploy viewPage
$ bn invoke viewPage
  1
$ bn invoke viewPage
  2
```

<details><summary style='font-size:20px'>Hint</b></summary>

Redis provides the atomic [INCR](https://redis.io/commands/INCR) command which allows you to increment a numeric value in Redis. Additionally, calls to INCR return the current count of the value you incremented.

</details>


<details><summary  style='font-size:20px'>Walkthrough</b></summary>

Start off by creating the template for our `viewPage` function.

```bash
$ bn create node8 viewPage
```

Before we can start implementing the logic for `viewPage`, we should first update the generated `binaris.yml` so the function has access to our Redis credentials at runtime.

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

Now, let's create a variable `KEY` which will be used for our `viewPage` operation.

```diff
> function.js
---
 const client = new Redis({
   host: process.env.REDIS_HOST,
   port: process.env.REDIS_PORT,
   password: process.env.REDIS_PASSWORD,
 });
+ 
+const KEY = 'numViews';
```

It's time to write our function logic. Instead of using the traditional Redis [SET](https://redis.io/commands/set) command, we can instead rely on the convenient [INCR](https://redis.io/commands/incr) command. `INCR` atomically increases the value of the specified key by 1. If the key specified is non-existent, `INCR` will create it for you.

Let's utilize `INCR` to increment our `numViews` key each time our function is called.

```diff
> function.js
---
 exports.handler = async (body, context) => {
+  return client.incr(KEY);
-  const name = context.request.query.name || body.name || 'World';
-  return `Hello ${name}!`;
 };
```

And that's it! But before we can deploy our new function we need to install the `ioredis` package we depend on.

```bash
$ npm install ioredis --save
$ bn deploy viewPage
```

Let's try it out

```bash
$ bn invoke viewPage
  1
$ bn invoke viewPage
  2
$ for n in {1..5}; do bn invoke viewPage; done
  3
  4
  5
  6
  7
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

// INCR operation will create key if it does not exist
const KEY = 'numViews';

exports.handler = async (body, context) => {
  return client.incr(KEY);
};
```

</details>


<details><summary>Final state binaris.yml</summary>

```YAML
functions:
  viewPage:
    file: function.js
    entrypoint: handler
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
$ bn deploy viewPage
$ bn invoke viewPage
  1
$ bn invoke viewPage
  2
$ for n in {1..5}; do bn invoke viewPage; done
  3
  4
  5
  6
  7
```

</details>