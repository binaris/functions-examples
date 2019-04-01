# Geoviews Redis function
## Goal

Create two functions that showcase how geo-locations can be stored in Redis and manipulated with Binaris.

1. A `geoView` function which stores the callers location each time it's invoked.
2. A `geoDistribution` function which returns all past caller locations in a `r` mile radius.

__Potential Interface__

```bash
$ bn deploy geoView
$ bn invoke geoView
  'ok'
$ bn invoke geoView --data '{ "ip": "82.20.162.131" }'
  'ok'
$ bn deploy geoDistribution
$ bn invoke geoDistribution
  ["68.171.97.146"]
$ bn invoke geoDistribution --data '{ "radiusInMiles": 5000 }'
  ["67.164.97.186","82.20.162.131"]
```

<details><summary style='font-size:20px'>Hint #1</b></summary>

Redis provides a full fledged [Geospatial API](https://redislabs.com/redis-best-practices/indexing-patterns/geospatial/). Consider using the [GEOADD](https://redis.io/commands/GEOADD) command to store the location of each individual caller. After you've stored some locations, you can use [GEORADIUSBYMEMBER](https://redis.io/commands/georadiusbymember) to run queries on the data.

</details>


<details><summary style='font-size:20px'>Hint #2</b></summary>

IP addresses encode tons of useful information including relatively accurate locational data. And since HTTP requests to Binaris functions include the senders IP in the `x-forwarded-for` header, IP's are a convenient way of determining the callers location. Utilize a package such as [iplocate](https://www.npmjs.com/package/node-iplocate) to directly translate incoming IP addresses into usable geospatial entries.

</details>


<details><summary  style='font-size:20px'>Walkthrough</b></summary>

Start off by creating the template for our `geoView` function.

```bash
$ bn create node8 geoView
```

Before we can start implementing the logic for `geoView`, we should first update the generated `binaris.yml` so the function has access to our Redis credentials at runtime.

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
+const KEY = 'geoViews';
```

Now it's time to answer the question, "How do we track the location of each request our function receives?".

The answer is, IP addresses. IP addresses encode tons of useful information including relatively accurate locational data. Incoming HTTP requests to Binaris functions include the senders IP in the `x-forwarded-for` header, so we'll use an IP address as a convenient way of determining the callers location. Once we have the IP, we'll rely on the [iplocate](https://www.npmjs.com/package/node-iplocate) package to resolve our IP addresses to actual locations. Let's get to it!

> Note: IP addresses aren't completely reliable (sometimes the resolved location can be incorrect), but they are more than enough for our purposes.

```diff
> function.js
---
 const KEY = 'geoViews';
+
+async function resolveLocation(body, context) {
+  if (body !== undefined && body.ip !== undefined) {
+    return IPLocator(body.ip);
+  }
+  const callerIP = context.request.headers['x-forwarded-for'].split(',')[0];
+  return IPLocator(callerIP);
+}
```

Since we know the end goal is to retrieve location data from an input IP address, we define a function, `resolveLocation` which will receive a HTTP request body & context from our `geoView` handler. To make testing our `geoView` function easier, we first check for an "ip" field explicitly passed in the body. If no IP is present in the body, we fallback to the guaranteed IP located in the `x-forwarded-for` header. Once we have an IP (either from the headers or body) we use `node-iplocator` to resolve the geolocation.

```diff
> function.js
---
 const Redis = require('ioredis');
+const IPLocator = require('node-iplocate');

 const client = new Redis({
```

Don't forget to require our `node-iplocate` dependency!

```diff
> function.js
---
 exports.handler = async (body, context) => {
+  const resolved = await resolveLocation(body, context);
-  const name = context.request.query.name || body.name || 'World';
-  return `Hello ${name}!`;
 };
```

The next step is to utilize the `resolveLocation` function by passing it the input `body` & `context`. `resolved` will contain the full output of `ip-locate` which is defined as

```JSON
// example output from ip-locate
{
  "ip": "8.8.8.8",
  "country": "United States",
  "country_code": "US",
  "city": null,
  "continent": "North America",
  "latitude": 37.751,
  "longitude": -97.822,
  "time_zone": null,
  "postal_code": null,
  "org": "Google LLC",
  "asn": "AS15169"
}
```

Now that we know what we have available to us, let's finish this function off by storing our location in Redis. To accomplish this we will utilize the [GEOADD](https://redis.io/commands/GEOADD) command from the Redis [Geospatial API](https://redislabs.com/redis-best-practices/indexing-patterns/geospatial/). Calls to `GEOADD` must contain a valid longitude, latitude and unique key which can be used to reference the entry.


```diff
> function.js
---
 exports.handler = async (body, context) => {
   const resolved = await resolveLocation(body, context);
+  await client.geoadd(KEY, resolved.longitude, resolved.latitude, resolved.ip);
+  return 'ok';
};
```

As you can see, we simply forward the fields resolved by our ip-locator into `geoadd`. This means, invocations from a unique IP will result in a new entry in our geo set.

`geoView` is now complete, but it's not of much use unless we can query the data too. Let's define our second and final function `geoDistribution` which will allow us to retrieve information about where users are calling our function from.


```diff
> binaris.yml
---
     env:
       REDIS_PORT:
       REDIS_HOST:
       REDIS_PASSWORD:
+  geoDistribution:
+    file: function.js
+    entrypoint: geoDistribution
+    executionModel: concurrent
+    runtime: node8
+    env:
+      REDIS_PORT:
+      REDIS_HOST:
+      REDIS_PASSWORD:
```

We update our `binaris.yml` so it's aware of our incoming `geoDistribution` function. Now it's time to actually write the implementation. Because `geoView` stores the locations of callers, it would be pretty cool if `geoDistribution` allowed you to query for all callers in a `r` mile radius. 


```diff
> function.js
---
 };

+exports.geoDistribution = async (body, context) => {
+  const radiusInMiles = context.request.query.radiusInMiles || body.radiusInMiles || 100;
+  const resolved = await resolveLocation(body, context);
+}
```

Let's quickly go over what's being done here. We previously decided to let the invoker of `geoDistribution` provide a radius to query for users in. We handle this by looking for a `radiusInMiles` field in either the body or query params. But a radius is only half the story, we also need to know where the radius is starting from. The `resolveLocation` function we defined for `geoView` solves just this problem. If no `ip` is explictly provided in the body, `geoDistribution` will use the callers ip as the center of the search radius. Otherwise, the caller can provide a specific ip to use the radius from. 

```diff
> function.js
---
 exports.geoDistribution = async (body, context) => {
   const radiusInMiles = context.request.query.radiusInMiles || body.radiusInMiles || 100;
   const resolved = await resolveLocation(body, context);
+  return client.georadiusbymember(KEY, resolved.ip, radiusInMiles, 'mi');
 }
```

Last but not least we use `georadiusbymember` to query for all "views" in a `r` mile radius starting from the resolved latitude and longitude. 

```bash
$ npm install ioredis node-iplocate --save
$ bn deploy geoView && bn deploy geoDistribution
```

Let's try it out

```bash
$ bn invoke geoView
  'ok'
$ bn invoke geoView --data '{ "ip": "82.20.162.131" }'
  'ok'
$ bn invoke geoDistribution
  ["68.171.97.146"]
$ bn invoke geoDistribution --data '{ "radiusInMiles": 5000 }'
  ["67.164.97.186","82.20.162.131"]
```

<details><summary>Final state function.js</summary>


```JavaScript
'use strict';

const Redis = require('ioredis');
const IPLocator = require('node-iplocate');

const client = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

const KEY = 'geoViews';

async function resolveLocation(body, context) {
  if (body !== undefined && body.ip !== undefined) {
    return IPLocator(body.ip);
  }
  const callerIP = context.request.headers['x-forwarded-for'].split(',')[0];
  return IPLocator(callerIP);
}

exports.handler = async (body, context) => {
  const resolved = await resolveLocation(body, context);
  await client.geoadd(KEY, resolved.longitude, resolved.latitude, resolved.ip);
  return 'ok';
};

exports.geoDistribution = async (body, context) => {
  const radiusInMiles = context.request.query.radiusInMiles || body.radiusInMiles || 100;
  const resolved = await resolveLocation(body, context);
  return client.georadius(KEY, resolved.longitude, resolved.latitude, radiusInMiles, 'mi');
}
```

</details>


<details><summary>Final state binaris.yml</summary>

```YAML
functions:
  geoView:
    file: function.js
    entrypoint: handler
    executionModel: concurrent
    runtime: node8
    env:
      REDIS_PORT:
      REDIS_HOST:
      REDIS_PASSWORD:
  geoDistribution:
    file: function.js
    entrypoint: geoDistribution
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
$ bn deploy geoView
$ bn invoke geoView
  'ok'
$ bn invoke geoView --data '{ "ip": "82.20.162.131" }'
  'ok'
$ bn deploy geoDistribution
$ bn invoke geoDistribution
  ["68.171.97.146"]
$ bn invoke geoDistribution --data '{ "radiusInMiles": 5000 }'
  ["67.164.97.186","82.20.162.131"]
```

</details>
