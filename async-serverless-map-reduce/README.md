# Async Map-Reduce Using Serverless Functions
*Parallelizing [computation of Pi using the Monte Carlo method](https://www.geeksforgeeks.org/estimating-value-pi-using-monte-carlo/) with serverless functions*

This example folows our [Naive Map-Reduce example](../naive-map-reduce).

## Running this example

If you are new to Binaris, visit our [Getting Started](https://dev.binaris.com/tutorials/python/getting-started/) page to set up your free account.

In order to run this example you need to have a Redis database version 5 or later up and running and accessible over the Internet. Configure the password, hostname and port number of your database in `REDIS_PASSWORD`, `REDIS_HOST` and `REDIS_PORT` environment variables respectively.

We start by deploying 4 functions to the cloud:

```bash
$ bn deploy public_compute_pi_mapper
$ bn deploy public_compute_pi_reducer
$ npm install request request-promise-native ioredis
$ bn deploy public_amr_controller
$ bn deploy public_amr_mapper
$ bn trigger setup amr --source-uri "redis+tls://:$REDIS_PASSWORD@$REDIS_HOST:$REDIS_PORT#inputs" --target public_amr_mapper
```

The file `job.json` describes our MapReduce job and is pretty much self-explanatory. We pass its content as parameters when invoking our MapReduce framework:

```bash
$ bn invoke public_amr_controller --json job.json
```

This will kick off an asynchronous computation, and so will not output and result. You can track the progress of the MapReduce job and see the final estimation of Pi by running:

```bash
$ bn logs public_amr_mapper
```

Feel free to play around with the number of points to achieve better accuracy. Make sure that the number of reduce points is the sum of all the input points.

## An asynchronous serverless MapReduce framework

Our framework uses two functions: `public_amr_controller` and `public_amr_mapper`. We also use a Redis stream to facilitate asynchronous invocation of the mapper function.

The controller function posts invocation requests onto the Redis stream. Each request corresponds to a single mapper job. A Binaris trigger is configured to listen to this Redis stream and invoke the `public_amr_mapper` functions for each data element posted onto the stream.

The mapper function `public_amr_mapper` is a bit more complicated and performas the following steps:
* Extract the job information from the stream data element.
* Invoke the user's mapper function specified in the job information. In our case, this is `public_compute_pi_mapper`.
* Save the output from the mapper onto a Redis HSET.
* Use Redis atomic increment to increase a count of terminated map jobs.
* When the count reaches the overall number of map jobs (this will happen only once because Redis increment is atomic), invoke the user's reducer function `public_compute_pi_reducer`.
* At this point we have the coverall result of the computation and we could store it in Redis or stream it back to the user (using another stream, of course). In this case, we just print it to the log.

This approach allows the user to have their map (`public_compute_pi_mapper`) and reduce (`public_compute_pi_reducer`) functions focus purely on computational logic. We rely on the underlying at-least-once guarantees provided by our stream-invocation to handle retries in case of invocation failures. This works perfectly well for the common case of indempotent mappers. If mapper functions have side effects we would need to use a trigger with stronger exactly-once invocation guarantees.
