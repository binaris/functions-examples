# Map-Reduce Using Serverless Functions
*Using serverless functions to parallelize [computation of Pi using the Monte Carlo](https://www.geeksforgeeks.org/estimating-value-pi-using-monte-carlo/)*

## Running this example

If you are new to Binaris, visit our [Getting Started](https://dev.binaris.com/tutorials/python/getting-started/) page to set up your free account.

We start by deploying 3 functions to the cloud:

```bash
bn deploy public_compute_pi_mapper
bn deploy public_compute_pi_reducer
bn deploy public_mr_controller
```

The file `job.json` describes our MapReduce job and is pretty much self-explanatory. We pass its content as parameters when invoking our MapReduce framework:

```bash
bn invoke public_mr_controller --json job.json
```

This should print an approximation of Pi. Feel free to play around with the number of points to get better accuracy. Make sure that the number of reduce points is the sum of all the input points.

You can follow the execution course of the MapReduce job using:

```bash
bn logs public_mr_controller
```

## A naive serverless MapReduce framework

Our framework has just one function `public_mr_controller` which takes the naive approach of invoking all mapper functions in parallel and witing for them to complete. Once they do, it invokes the reducer function and returns it result to the caller.

This approach allows the user to have their map (`public_compute_pi_mapper`) and reduce (`public_compute_pi_reducer`) functions focus purely on computational logic. However, it does not account for failures, retries or laggards. In other examples we use streaming to implement a more robust asyncroneous.
