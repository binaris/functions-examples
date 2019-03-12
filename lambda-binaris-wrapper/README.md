# Lambda wrapper example

This example demonstrates how to deploy a Binaris function that will run Lambda code.

### Usage

```bash
$ npm install
$ bn deploy wrapped_lambda
$ bn invoke wrapped_lambda
  "Hello serverless!"
```

If you have existing Lambda code you would like to use, simply replace the contents of `handler.js`.

> Note: If your Lambda code has a different entrypoint, remember to update the `binaris.yml`