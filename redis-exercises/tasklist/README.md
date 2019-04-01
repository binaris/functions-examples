# Task List Redis Function
## Goal

Create two functions. 

1. A `addTask` which should add a task to your task list.
1. A `getNextTask` should return the next task to complete using FIFO (First in First Out).

__Potential Interface__

```bash
$ bn deploy addTask
$ bn invoke addTask --data '{ "task": "Eat Breakfast" }'
  1
$ bn invoke addTask --data '{ "task": "Do Homework" }'
  2
$ bn invoke addTask --data '{ "task": "Walk the Dog" }'
  3
$ bn deploy getNextTask
$ bn invoke getNextTask
  "Eat Breakfast"
$ bn invoke getNextTask
  "Do Homework"
$ bn invoke getNextTask
  "Walk the Dog"
$ bn invoke getNextTask
  "No tasks remain!"
```

<details><summary style='font-size:20px'>Hint</b></summary>

Redis supports a [list](https://redis.io/topics/data-types) data type. Consider using [RPUSH](https://redis.io/commands/rpush) in conjunction with [LPOP](https://redis.io/commands/lpop) to achieve the desired FIFO functionality.

</details>


<details><summary  style='font-size:20px'>Walkthrough</b></summary>

Let's start by creating the template for our function that adds items to the task list.

```bash
$ bn create node8 addTask
```

Before we can start implementing the logic for `addTask`, we should first update the generated `binaris.yml` so the function has access to our Redis credentials at runtime.

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

Now, let's create a variable `KEY` which will be used for our `addTask` operation.

```diff
> function.js
---
 const client = new Redis({
   host: process.env.REDIS_HOST,
   port: process.env.REDIS_PORT,
   password: process.env.REDIS_PASSWORD,
 });
+ 
+const KEY = 'tasks';
```

We're ready to implement `addTask`, let's add validation for the `task` body parameter. This will make it possible for users to send tasks to our function.

```diff
> function.js
---
 exports.handler = async (body, context) => {
+  if (body.task === undefined) {
+    throw new Error('"task" body parameter required!');
+  }
-  const name = context.request.query.name || body.name || 'World';
-  return `Hello ${name}!`;
 }
```

Considering that this is a task list, we need to hope Redis has some list like structure that we can store our tasks in. As you might expect, Redis has support for exactly what we need. A full fleged [list](https://redis.io/topics/data-types) type is available as a Redis primitive. By accessing the list via the available [RPUSH](https://redis.io/commands/rpush) command, we should easily be able to implement the desired FIFO functionality.

```diff
> function.js
---
 exports.handler = async (body, context) => {
   if (body.task === undefined) {
     throw new Error('"task" body parameter required!');
   }
+  return client.rpush(KEY, body.task);
 }
```

Our `addTask` implementation is complete, but it's not very useful without the accompanying `getNextTask` function we defined at the beginning of our exercise. Let's fix that by adding a second function `getNextTask` to our `binaris.yml` and `function.js`.

```diff
> binaris.yml
---
     env:
       REDIS_PORT:
       REDIS_HOST:
       REDIS_PASSWORD:
+  getNextTask:
+    file: function.js
+    entrypoint: getNextTask
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
   return client.rpush(KEY, body.task);
 };
+
+exports.getNextTask = async () => {
+  const nextTask = await client.lpop(KEY);
+  return (nextTask === null) ? 'No tasks remain!' : nextTask;
+}
```

Fortunately `getNextTask` is pretty straightforward. We use [LPOP](https://redis.io/commands/lpop) to remove the first item in the list, therefore achieving the FIFO functionality we've been looking for. Before we return the task, we make sure it's non-null and in the case it's null we return the concise and helpful message "No tasks remain!".

Before we can deploy our new functions we need to install the `ioredis` package we depend on.

```bash
$ npm install ioredis --save
$ bn deploy addTask && bn deploy getNextTask
```

Let's try it out

```bash
$ bn invoke addTask --data '{ "task": "Eat Breakfast" }'
  1
$ bn invoke addTask --data '{ "task": "Do Homework" }'
  2
$ bn invoke addTask --data '{ "task": "Walk the Dog" }'
  3
$ bn invoke getNextTask
  "Eat Breakfast"
$ bn invoke getNextTask
  "Do Homework"
$ bn invoke getNextTask
  "Walk the Dog"
$ bn invoke getNextTask
  "No tasks remain!"
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

const KEY = 'tasks';

exports.handler = async (body, context) => {
  if (body.task === undefined) {
    throw new Error('"task" body parameter required!');
  }
  return client.rpush(KEY, body.task);
};

exports.getNextTask = async () => {
  const nextTask = await client.lpop(KEY);
  return (nextTask === null) ? 'No tasks remain!' : nextTask;
}
```

</details>


<details><summary>Final state binaris.yml</summary>

```YAML
functions:
  addTask:
    file: function.js
    entrypoint: handler
    executionModel: concurrent
    runtime: node8
    env:
      REDIS_PORT:
      REDIS_HOST:
      REDIS_PASSWORD:
  getNextTask:
    file: function.js
    entrypoint: getNextTask
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
$ bn deploy addTask
$ bn invoke addTask --data '{ "task": "Eat Breakfast" }'
  1
$ bn invoke addTask --data '{ "task": "Do Homework" }'
  2
$ bn invoke addTask --data '{ "task": "Walk the Dog" }'
  3
$ bn deploy getNextTask
$ bn invoke getNextTask
  "Eat Breakfast"
$ bn invoke getNextTask
  "Do Homework"
$ bn invoke getNextTask
  "Walk the Dog"
$ bn invoke getNextTask
  "No tasks remain!"
```

</details>
