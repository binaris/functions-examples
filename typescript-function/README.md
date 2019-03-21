# TypeScript function (NodeJS and TypeScript)

Boilerplate setup for a Binaris function written in TypeScript

It is assumed you already have a Binaris account. If you don't have an account yet, worry not, signing up is painless and takes just 2 minutes. Visit [Getting Started](https://dev.binaris.com/tutorials/nodejs/getting-started/) to find concise instructions for the process.

## Using the function

1. Install dev-dependencies needed to compile TypeScript.

    ```bash
    $ npm install
    ```

1. Compile the TypeScript function for Binaris deployment.

    ```bash
    $ npm run build
    ```

1. Deploy the function.

    ```bash
    $ bn deploy typescript
    ```

1. Invoke.

    ```bash
    $ bn invoke typescript
      "Hello World!"
    ```

> Note: The "npm run deploy" script is a convenience target that compiles and deploys your TypeScript function