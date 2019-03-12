# Five-Minute Serverless Backend
*How to build a **serverless backend** for your web application and have it up and running on the cloud in minutes.*

This tutorial takes you through 5 steps to building a backend for your web application:
1. Setup your Binaris environment
1. Create a serverless function for your backend code
1. Update your function to work from a browser
1. Call your function from frontend code

## Setup your Binaris environment

If you do not have a Binaris account, [sign up for free](https://binaris.com/signup?t=8CDa37). At the end of the sign-up process you will receive an account ID and API key. Save them for the next steps.

Install the CLI:

```
$ npm install binaris -g
```

Run `bn login` and paste in the API key received above to authenticate your account.

## Create a serverless function for your backend code

Create a new folder and use the CLI to create the template code for your function:

```
$ mkdir backend
$ cd backend
$ bn create node8 public_backend
Created function public_backend in .../backend
  (use "bn deploy public_backend" to deploy the function)
  ```

This will create a configuration file `binaris.yml` and source file `function.js`.

For the sake of this tutorial, we'll build the simplest possible backend to convert strings to upper case. Let's edit the source code for our function:

```diff
> function.js
---
 exports.handler = async (body, context) => {
-  const name = context.request.query.name || body.name || 'World';
-  return `Hello ${name}!`;
+  return (typeof(body) === 'string' ? body : '').toUpperCase();
 }
```

We can now deploy our function to the cloud:

```
$ bn deploy public_backend
Deployed function public_backend
Invoke with one of:
  "bn invoke public_backend"
  "curl https://run.binaris.com/v2/run/<Your_Account_Number>/public_backend"
```

Our function is up and running and will autoscale with invocations. We can use `curl` to invoke it:

```
$ curl https://run.binaris.com/v2/run/$(bn show accountId)/public_backend -d '"hello"'
"HELLO"
```

In the actual deploy printout `<Your_Account_Number>` will be replaced by your own account ID. If you don't have it handy, you can find that by typing

```
$ bn show accountId
```

Note that by default, Binaris functions are configured to receive JSON input and return JSON output.

## Update your function to work from a browser

Binaris provides an HTTP endpoint for every function out of the box (no need to configure an API gateway). However, in order to call the function from a browser we need to bypass the browser's [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) protection. We can do this by adding a bit of code to our function. First we will create a wrapper function to return CORS headers:

```diff
> function.js
+const CORS = (handler) =>
+  async (body, context) => {
+    const response = {
+      statusCode: 200,
+      headers: {
+        'Access-Control-Allow-Origin': '*',
+        'Access-Control-Allow-Headers': context.request.headers["access-control-request-headers"],
+      },
+    };
+    if (context.request.method !== 'OPTIONS') {
+      const output = await handler(body);
+      response.headers['Content-Type'] = 'application/json';
+      response.body = JSON.stringify(output);
+    }
+    return new context.HTTPResponse(response);
+  };
+;
+
 exports.handler = async (body, context) => {
```

This function uses the execution `context` to create a custom `HTTPResponse` object and adds the relevant headers to the response. You can use this object to customize response headers, the response body and the HTTP status code. Please note that when using custom responses, Binaris no longer automatically JSON encodes the output so you need to do this yourself.

Now all we need to do is wrap our handler with this functions and we're done:

```diff
-exports.handler = async (body, context) => {
+exports.handler = CORS(async (body, context) => {
   return (typeof(body) === 'string' ? body : '').toUpperCase();
-};
+});
```

Our logic remains unchanged. We can now re-deploy and test:

```
$ bn delpoy public_backend
$ curl -i https://run.binaris.com/v2/run/<Your_Account_Number>/public_backend -H 'Content-Type: application/json' -d '"hello"'
HTTP/1.1 200 OK
Server: openresty/1.13.6.1
Date: Thu, 14 Feb 2019 23:16:06 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 7
Connection: keep-alive
X-Binaris-Bolt-Duration-Usecs: 1190.336
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
X-Binaris-Request-ID: 89429871a0c1c8f5d9af68ab227bf9e3

"HELLO"
```

Notice the ``Access-Control-Allow-*`` headers in the response.

Here is the final code for our backend `function.js`:

```javascript
const CORS = (handler) =>
  async (body, context) => {
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': context.request.headers["access-control-request-headers"],
      },
    };
    if (context.request.method !== 'OPTIONS') {
      const output = await handler(body);
      response.headers['Content-Type'] = 'application/json';
      response.body = JSON.stringify(output);
    }
    return new context.HTTPResponse(response);
  };
;

exports.handler = CORS(async (body, context) => {
  return (typeof(body) === 'string' ? body : '').toUpperCase();
});
```

## Call your function from frontend code

Our backend is now live and we can use a simple HTML app to call it. The app code is in a single file named `frontend.html`.

First you need to plug in your Binaris account ID. At the very top of the file, locate the following line:

```htmlmixed
    <script>const BINARIS_ACCOUNT_ID = '<Your_Account_Number>'</script>
```

Replace `<Your_Account_Number>` with your actual account ID.

You can now open `frontend.html` in your browser to run the app. Simply type in some text and hit Enter. The text will be sent to the backend and returned in upper-case to be displayed on screen.

Calling our backend is a simple HTTP POST request, and this example uses `fetch` to handle HTTP request and response headers.

We implemented a helper function to invoke our backend cloud function:

```javascript
const invoke = async (name, input) => {
  const url = `https://run.binaris.com/v2/run/${BINARIS_ACCOUNT_ID}/${name}`;
  const body = JSON.stringify(input);
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(url, {
    method: 'POST',
    body,
    headers,
  });
  const ct = res.headers.get('Content-Type');
  if (res.status !== 200 || !ct || !ct.startsWith('application/json')) {
    throw new Error(`Backend error: status=${res.status} response: ${res.body}`);
  }
  return res.json();
};
```

This helper function uses the Binaris URL structure and the account ID configured above to form the backend URL. It also handles JSON encoding and decoding, and sets and verifies content type headers.

All that's left now is to call our backend whever the user change the input:

```javascript
$input.addEventListener('input', async e => {
  $output.innerHTML = await invoke('public_backend', $input.value);
});
```

The actual invocation is a simple one-liner calling our helper function with the name of our serverless function and the input object. In case of error, invoke throughs an exception and the on-screen status remains unchanged.

## What's next?

That's it! We've seen how simple and fast it is to create a scalable cloud backend using Binaris serverless functions. Visit our [developer site](https://dev.binaris.com/) for more tutorials and documentation. Visit our [binaris.com](https://www.binaris.com/) to learn more about the platform.
