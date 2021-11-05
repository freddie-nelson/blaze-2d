import Thread, { ThreadTask } from "./thread";

export default class ThreadPool {
  cores = navigator.hardwareConcurrency || 1; // number of workers the browser can run concurrently
  threads: Thread[] = [];

  private poolQueue: ThreadTask[] = []; // used when all thread queues are full
  poolingRate = 2000; // ms between each pool clean

  /**
   * Creates a {@link ThreadPool} instance, executes any provided startup tasks on it's threads and starts it's cleaning loop.
   *
   * @param startupTasks Tasks to run on each created thread.
   */
  constructor(...startupTasks: ThreadTask[]) {
    for (let i = 0; i < this.cores; i++) {
      this.threads.push(new Thread(`Thread ${i}`));
    }

    this.everyThread(...startupTasks);
    this.cleanPool();
  }

  /**
   * Attempts to run or queue the task on the best open thread (shortest queue)
   *
   * Even when return value is false, the task is still added to the pool's queue to await execution.
   *
   * @param task
   * @param queue Wether or not to add the task to the queue if no thread is open
   * @returns true/false depending on wether an open thread was found
   */
  requestThread(task: ThreadTask, queue: boolean = true): boolean {
    let openThread: Thread;
    for (const t of this.threads) {
      if (
        t.isFree() &&
        t.getNumInQueue() < (openThread ? openThread.getNumInQueue() : Number.MAX_SAFE_INTEGER)
      ) {
        openThread = t;
      }
    }

    if (openThread) {
      openThread.addTask(task);
      return true;
    } else {
      if (queue) this.poolQueue.push(task);
      return false;
    }
  }

  /**
   * Adds every provided task to every thread's queue, ignoring queue size limits.
   *
   * @param tasks
   */
  everyThread(...tasks: ThreadTask[]) {
    for (const thread of this.threads) {
      tasks.forEach((task) => {
        thread.addTask(task, true);
      });
    }
  }

  /**
   * Moves as many tasks as possible from the pool queue to open threads
   */
  private cleanPool() {
    if (this.poolQueue.length !== 0) {
      for (let i = this.poolQueue.length - 1; i >= 0; i--) {
        const task = this.poolQueue[i];

        if (this.requestThread(task, false)) {
          this.poolQueue.splice(i, 1);
        } else break;
      }
    }

    setTimeout(() => this.cleanPool(), this.poolingRate);
  }

  /**
   * Gets the length of the pool's queue.
   *
   * @returns The pool's queue length
   */
  getQueueLength() {
    return this.poolQueue.length;
  }
}
