# Proxy deployer

## Instructions


  ```bash
  $ npm install
  ```

  Ensure your binaris api key and account ID are exported like so

  ```bash
  $ export BINARIS_API_KEY=<YOUR_KEY> BINARIS_ACCOUNT_ID<YOUR_ID>
  ```

  Now we need to deploy the deployer function

  ```bash
  $ bn deploy deployer
  ```

  Now you can deploy any other simple function by running

  ```bash
  $ ./deployLocal.js faasDeploy <desired-function-name> <path-to-function-file>
  ```

  This example works out of the box

  ```bash
  $ ./deployLocal.js faasDeploy helloWorldFunc ./hello.js
  ```