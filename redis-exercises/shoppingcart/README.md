# Shopping Cart Redis Function
## Goal

Create two functions. 

1. A `addItem` which should add `n` number of `item` to your shopping cart. 
1. A `getAllItems` which should return all items in your cart.

__Potential Interface__

```bash
$ bn deploy addItem
$ bn invoke addItem --data '{ "item": "eggs" }'
  1
$ bn invoke addItem --data '{ "item": "eggs" }'
  2
$ bn invoke addItem --data '{ "item": "bread" }'
  1
$ bn invoke addItem --data '{ "item": "milk", "quantity": 5 }'
  5
$ bn invoke addItem --data '{ "item": "milk", "quantity": 5 }'
  10
$ bn deploy getAllItems
$ bn invoke getAllItems
  {"eggs":"2","bread":"1","milk":"10"}
```

<details><summary style='font-size:20px'>Hint #1</b></summary>

Redis [Hashes](https://redis.io/topics/data-types) provide a convenient interface for storing groups of items. Specifically, [HINCRBY](https://redis.io/commands/hincrby) provides an interface for incrementing the numerical value of a hash sub-field.

</details>

<details><summary style='font-size:20px'>Hint #2</b></summary>

Use [HGETALL](https://redis.io/commands/hgetall) to easily retrieve all items in a specific hash.

</details>


<details><summary  style='font-size:20px'>Walkthrough</b></summary>

Let's start by creating the template for our function that adds items to the shopping cart.

```bash
$ bn create node8 addItem --config.entrypoint 'addItem'
```

Before we can start implementing the logic for `addItem`, we should first update the generated `binaris.yml` so the function has access to our Redis credentials at runtime.

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

Now, let's create a variable `KEY` which will be used for our `addItem` operation.

```diff
> function.js
---
 const client = new Redis({
   host: process.env.REDIS_HOST,
   port: process.env.REDIS_PORT,
   password: process.env.REDIS_PASSWORD,
 });
+ 
+const KEY = 'cart';
```

Now, it's time to get down to business. We decided at the beginning of the exercise, to allow users to add more than 1 of an item to the cart in a single invocation.

```diff
> function.js
---
 exports.addItem = async (body, context) => {
+  const quantity = body.quantity || 1;
-  const name = context.request.query.name || body.name || 'World';
-  return `Hello ${name}!`;
 }
```

We support this functionality through the optional `quantity` parameter. If the user chooses to not explicitly provide a `quantity`, we'll assume they're simply adding 1 of that item.

```diff
> function.js
---
 exports.addItem = async (body, context) => {
   const quantity = body.quantity || 1;
+  if (body.item === undefined) {
+    throw new Error('"item" body parameter required!');
+  }
 }
```

Next we add validation for the `item` body parameter. This required parameter contains an item the user wants to add to the cart.

All that's left is actually storing this in Redis. To accomplish this we'll rely on Redis [hashes](https://redis.io/topics/data-types). Hashes in Redis, function similarly to dictionaries in traditional programming languages. A master `KEY` is used to store/access subfields of the hash.

```diff
> function.js
---
   if (body.item === undefined) {
     throw new Error('"item" body parameter required!');
   }
+  return client.hincrby(KEY, body.item, quantity);
 }
```

[HINCRBY](https://redis.io/commands/hincrby) is a Redis command that allows you to increment a subfield of a hash by the desired amount. Conveniently, if the sub-field or parent hash does not exist, it will be created for you.


Our `addItem` implementation is complete, but it's uninteresting without a way to also retrieve the items in our cart. Let's tackle this, by adding a second function `getAllItems` to our `binaris.yml` and `function.js`.

```diff
> binaris.yml
---
     env:
       REDIS_PORT:
       REDIS_HOST:
       REDIS_PASSWORD:
+  getAllItems:
+    file: function.js
+    entrypoint: getAllItems
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
   return client.hincrby(KEY, body.item, quantity);
 };
+
+exports.getAllItems = async () => {
+  return client.hgetall(KEY);
+}
```

`getAllItems` consists of a single line so there isn't much to cover. It utilizes [HGETALL](https://redis.io/commands/hgetall) which returns ALL of the items that have been previously stored in the hash/cart.

> Note: HGETALL works for something like a shopping cart, but remember it returns ALL of the hashes data.

Before we can deploy our new functions we need to install the `ioredis` package we depend on.

```bash
$ npm install ioredis --save
$ bn deploy addItem && bn deploy getAllItems
```

Let's try it out

```bash
$ bn invoke addItem --data '{ "item": "eggs" }'
  1
$ bn invoke addItem --data '{ "item": "eggs" }'
  2
$ bn invoke addItem --data '{ "item": "bread" }'
  1
$ bn invoke addItem --data '{ "item": "milk", "quantity": 5 }'
  5
$ bn invoke addItem --data '{ "item": "milk", "quantity": 5 }'
  10
$ bn invoke getAllItems
  {"eggs":"2","bread":"1","milk":"10"}
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

const KEY = 'cart';

exports.addItem = async (body, context) => {
  const quantity = body.quantity || 1;
  if (body.item === undefined) {
    throw new Error('"item" body parameter required!');
  }
  return client.hincrby(KEY, body.item, quantity);
};

exports.getAllItems = async () => {
  return client.hgetall(KEY);
}
```

</details>


<details><summary>Final state binaris.yml</summary>

```YAML
functions:
  addItem:
    file: function.js
    entrypoint: addItem
    executionModel: concurrent
    runtime: node8
    env:
      REDIS_PORT:
      REDIS_HOST:
      REDIS_PASSWORD:
  getAllItems:
    file: function.js
    entrypoint: getAllItems
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
$ bn deploy addItem
$ bn invoke addItem --data '{ "item": "eggs" }'
  1
$ bn invoke addItem --data '{ "item": "eggs" }'
  2
$ bn invoke addItem --data '{ "item": "bread" }'
  1
$ bn invoke addItem --data '{ "item": "milk", "quantity": 5 }'
  5
$ bn invoke addItem --data '{ "item": "milk", "quantity": 5 }'
  10
$ bn deploy getAllItems
$ bn invoke getAllItems
  {"eggs":"2","bread":"1","milk":"10"}
```

</details>