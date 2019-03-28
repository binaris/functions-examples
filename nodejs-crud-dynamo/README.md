# NodeJS DynamoDB CRUD

Wraps basic CRUD operations for DynamoDB in Binaris functions.

# Using the CRUD

It is assumed you already have a Binaris account. If you don't have an account yet, worry not, signing up is painless and takes just 2 minutes. Visit [Getting Started](https://dev.binaris.com/tutorials/nodejs/getting-started/) to find concise instructions for the process.

To use any of the functions in this example, you must export the following three variables into your environment (before deployment).

* `AWS_ACCESS_KEY_ID` # AWS access key
* `AWS_SECRET_ACCESS_KEY` # secret AWS credential
* `AWS_REGION` # AWS region used for DynamoDB

## Deploy

A helper command "deploy" is defined in the package.json to simplify the deployment process

```bash
$ npm run deploy
```

## Create the Table

```bash
$ bn invoke createDriversTable
```

## Create a Driver

```bash
$ npm run createDriver
```

or

```bash
$ bn invoke createDriver --json ./queries/createDriver.json
```

## Read a Driver

```bash
$ npm run readDriver 
```

or

```bash
$ bn invoke readDriver --json ./queries/readDriver.json
```

## Update a Driver

```bash
$ npm run updateDriver
```

or

```bash
$ bn invoke updateDriver --json ./queries/updateDriver.json
```

## Delete a Driver

```bash
$ npm run deleteDriver
```

or

```bash
$ bn invoke deleteDriver --json ./queries/deleteDriver.json
```


## Remove

A helper command "remove" is defined in the package.json to simplify the removal process

```bash
$ npm run remove
```