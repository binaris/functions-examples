/* eslint-disable no-param-reassign */
import msleep from './msleep';
import GenWorker from './gen.worker';

class WorkerHandle {
  /**
   * Create a handle to an existing Worker
   *
   * @param {number} workerID - valid ID of a Worker in the pool
   * @param {object} worker - actual worker object
   */
  constructor(workerID, worker = undefined) {
    this.ID = workerID;
    this.worker = worker;
  }
}

// We use multiple threads in addition to functions in order
// to give the browser a fair chance. Javascript performs very
// poorly when the main thread is blocked.
//
// To validate the rationale that functions are the best solution
// we need to at least move as much compute off the main thread as
// possible.

class WorkerPool {
  /**
   * Create a pool of workers which can be reused for similar
   * tasks.
   *
   * @param {number} numWorkers - how many workers should exist in the pool
   * @param {number} maxTasksPerWorker - number of tasks each worker can do at once
   * @param {number} workerSearchSleepTime - amount of time (ms) to sleep
   *                 when searching for an open worker
   */
  constructor(numWorkers, maxTasksPerWorker, workerSearchSleepTime = 2) {
    this.numWorkers = numWorkers;
    this.workersAvailable = new Array(this.numWorkers).fill(0);
    this.workers = [];
    for (let i = 0; i < this.numWorkers; i += 1) {
      this.workers.push(new GenWorker());
    }
    this.maxTasksPerWorker = maxTasksPerWorker;
    this.workerSearchSleepTime = workerSearchSleepTime;
    this.draining = false;
    this.adjusting = false;
  }

  /**
   * Returns a handle to an available Worker once one is ready.
   * This could potentially take a long time depending on the
   * number of workers and scale of the task.
   *
   * @return {object} - handle to Worker that can be used for the task
   */
  async getAvailableWorker() {
    let workerNum;
    let foundWorker = false;
    while (!foundWorker) {
      if (this.draining === true) {
        return undefined;
      }
      for (let i = 0; i < this.numWorkers; i += 1) {
        if (this.workersAvailable[i] < this.maxTasksPerWorker) {
          workerNum = i;
          this.workersAvailable[i] += 1;
          foundWorker = true;
          break;
        }
      }
      await msleep(this.workerSearchSleepTime);
    }
    return new WorkerHandle(workerNum, this.workers[workerNum]);
  }

  /**
   * Release a Worker so it can be used again in the pool
   *
   * @param {object} workerHandle - handle to valid worker
   */
  releaseWorker(workerHandle) {
    this.workersAvailable[workerHandle.ID] -= 1;
  }

  /**
   * Sets the function that should trigger on worker finishing
   * it's task.
   *
   * @param {function} msgEventFunction - function to handle post message event
   */
  setWorkersMessageEvent(msgEventFunction) {
    this.onMessage = msgEventFunction;
    // eslint-disable-next-line no-return-assign
    this.workers.forEach(worker => (worker.onmessage = msgEventFunction));
  }

  changeNumWorkers(numWorkers) {
    if (this.adjusting) return false;
    if (numWorkers === this.numWorkers) return true;

    this.adjusting = true;
    const oldNum = this.numWorkers;

    if (numWorkers > oldNum) {
      const diff = numWorkers - oldNum;
      for (let i = 0; i < diff; i += 1) {
        const addedWorker = new GenWorker();
        addedWorker.onmessage = this.onMessage;
        this.workers.push(addedWorker);
        this.workersAvailable.push(0);
      }
      this.numWorkers = numWorkers;
      this.adjusting = false;
      return true;
    } else {
      this.numWorkers = numWorkers;
      const drainWorkers = this.workers.splice(numWorkers);
      let allDone = false;
      while (!allDone) {
        allDone = true;
        for (let i = this.numWorkers; i < oldNum; i += 1) {
          if (this.workersAvailable[i] !== 0) {
            allDone = false;
          }
        }
      }
      drainWorkers.forEach(worker => worker.terminate());
      this.workersAvailable.length = this.numWorkers;
      this.adjusting = false;
    }

    return true;
  }

  /**
   * Drain all workers in this pool so they have no tasks
   */
  async drain() {
    let drained = false;
    this.draining = true;
    while (!drained) {
      drained = this.workersAvailable.every(w => w === 0);
      if (!drained) {
        await msleep(this.workerSearchSleepTime);
      }
    }
    this.draining = false;
  }
}

module.exports = { WorkerPool, WorkerHandle };
