# Map-Reduce Using Serverless Functions
*Parallelizing [computation of Pi using the Monte Carlo method](https://www.geeksforgeeks.org/estimating-value-pi-using-monte-carlo/) with serverless functions*

## Running the synchronous example

If you are new to Binaris, visit our [Getting Started](https://dev.binaris.com/tutorials/nodejs/getting-started/) page to set up your free account.

We start by deploying 3 functions to the cloud:

```bash
$ bn deploy public_compute_pi_mapper
$ bn deploy public_compute_pi_reducer
$ npm install request request-promise-native
$ bn deploy public_mr_controller
```

The file `job.json` describes our MapReduce job and is pretty much self-explanatory. We pass its content as parameters when invoking our MapReduce framework:

```bash
$ bn invoke public_mr_controller --json job.json
```

This should print an approximation of Pi. Feel free to play around with the number of points to achieve better accuracy. Make sure that the number of reduce points is the sum of all the input points.

You can see the logs for the MapReduce job using:

```bash
$ bn logs public_mr_controller
```

You can also track its progress in (near) real time with:

```bash
$ bn logs --tail public_mr_controller
```

## A synchronous serverless MapReduce framework

Our framework has just one function `public_mr_controller` which takes the naive approach of invoking all mapper functions in parallel and waiting for them to complete. Once they complete, it invokes the reducer function and returns the result to the caller.

This approach allows the user to have their map (`public_compute_pi_mapper`) and reduce (`public_compute_pi_reducer`) functions focus purely on computational logic. However, it does not account for failures, retries or laggards. For that, we turn to our asynchronous example below.

## Running the asynchronous example

Once you have the naive example up and running, you can proceed with the following steps:

```bash
$ npm install ioredis
$ bn deploy public_amr_controller
$ bn deploy public_amr_mapper
$ bn trigger setup amr --source-uri "redis+tls://:$REDIS_PASSWORD@$REDIS_HOST:$REDIS_PORT#inputs" --target public_amr_mapper
```

You can run the async example with the same `job.json` file:

```bash
$ bn invoke public_amr_controller --json job.json
```

This will kick off the asynchronous computation, and therefore will not output and result. You can track the progress of the MapReduce job and see the final estimation of Pi by running:

```bash
$ bn logs --tail public_amr_mapper
```

## An asynchronous serverless MapReduce framework

Our async framework uses two functions: `public_amr_controller` and `public_amr_mapper`. We also use a Redis stream to facilitate asynchronous invocation of the mapper function.

The controller function posts invocation requests into the Redis stream. Each request corresponds to a single mapper job. A Binaris trigger is configured to listen to this Redis stream and invoke the `public_amr_mapper` functions for each data element posted into the stream.

The mapper function `public_amr_mapper` is a bit more complicated and performs the following steps:
* Extract the job information from the stream data element.
* Invoke the user's mapper function specified in the job information. In our case, this is `public_compute_pi_mapper`.
* Save the output from the mapper into a Redis Set.
* Use Redis atomic increment to count the number of completed map jobs.
* When the count equals the overall number of map jobs (this will happen only once, because Redis increment is atomic), invoke the user's reducer function `public_compute_pi_reducer`.
* At this point we have the final result of the computation and we could store it in Redis, or stream it back to the user (using another stream, of course). In this case, we just print it to the log.

This approach allows the user to have their map (`public_compute_pi_mapper`) and reduce (`public_compute_pi_reducer`) functions focus purely on computational logic. We rely on the underlying at-least-once guarantees provided by our stream-invocation to handle retries in case of invocation failures. This works perfectly well for the common case of idempotent mappers. If mapper functions have side effects we would need to use a trigger with stronger exactly-once invocation guarantees.
