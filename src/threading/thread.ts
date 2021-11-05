import { BLZWorker, WorkerMessage } from "./worker";

export type ThreadTaskData =
  | ArrayBuffer
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Float32Array
  | Float64Array;

export interface ThreadTaskDataObject {
  [index: string]: ThreadTaskData | ThreadTaskData[] | ThreadTaskDataObject;
}

export interface ThreadTask {
  task: "chunk-generation" | "init-chunk-generator" | "chunk-geometry" | "init-geometry-generator";
  // priority: number;
  data: ThreadTaskData | ThreadTaskData[] | ThreadTaskDataObject;
  cb?: (data?: any) => void;
}

export default class Thread {
  private worker: BLZWorker;
  private inUse = false;
  private currentTask: ThreadTask;
  private queue: ThreadTask[] = [];
  private maxQueueSize = Infinity; // maximum size a thread's queue can be before main thread must be used
  private id: string;
  private cleanRate = 100; // rate at which the queue is checked for hanging tasks that need to be executed in ms

  /**
   * Creates a {@link Thread} instance, sets up it's worker and starts it's cleaning loop.
   *
   * @param id A string to be used as an identifier for this thread.
   */
  constructor(id: string) {
    this.id = id;

    this.setupWorker();
    this.clean();
  }

  /**
   * Sets up the thread's worker and it's associated events.
   */
  private setupWorker() {
    this.worker = new Worker(
      new URL(process.env.NODE_ENV === "development" ? "worker.js" : "worker.ts", import.meta.url),
      { type: "module" }
    );
    this.worker.onmessage = (e) => this.handleMessage(e.data);
    this.worker.onerror = (e) => this.log(e);
    this.worker.onmessageerror = (e) => this.log(e);
  }

  /**
   * Handles a message from the thread's worker
   *
   * @param msg The message received from the worker
   */
  private handleMessage(msg: WorkerMessage) {
    // this.log(msg);
    switch (msg.task) {
      case "completed":
        if (this.currentTask.cb) this.currentTask.cb(msg.data);
        this.nextTask();
        break;
      default:
        break;
    }
  }

  /**
   * Attempts to run a task on the thread or add it to the queue.
   *
   * @param task The task to run or queue.
   * @param skipQueue If true then the max queue size is ignored and the task is prepended to the front of the queue
   * @returns True when the task is ran or queued, false otherwise
   */
  addTask(task: ThreadTask, skipQueue: boolean = false) {
    if (skipQueue) {
      if (this.inUse) this.queue.unshift(task);
      else {
        this.sendTask(task);
      }
      return true;
    }

    if (this.inUse && this.queue.length < this.maxQueueSize) {
      this.queue.push(task);
      return true;
    } else if (!this.inUse) {
      let chosen = task;
      if (this.queue.length > 0) {
        this.queue.push(task);
        chosen = this.queue.shift();
      }

      this.sendTask(chosen);

      return true;
    }

    return false;
  }

  /**
   * Sends a task to the thread's worker, saves a reference to the sent task and marks the thread as in use.
   *
   * No checks are made to see if the thread is in use before sending the task.
   *
   * @param task The task to send to the thread's worker.
   */
  private sendTask(task: ThreadTask) {
    this.currentTask = task;
    this.inUse = true;
    this.worker.postMessage({ task: task.task, data: task.data });
  }

  /**
   * Sends the next task in the thread's queue to it's worker.
   *
   * If the queue is empty then the thread marks itself as not in use.
   */
  private nextTask() {
    if (this.queue.length === 0) {
      this.inUse = false;
      return;
    }

    this.sendTask(this.queue.shift());
  }

  /**
   * Attempts to clean out the thread's queue whenever the thread has hung.
   *
   * A hung thread is one in which the thread is not in use but it has task(s) in it's queue.
   */
  private clean() {
    if (!this.inUse && this.queue.length > 0) {
      this.sendTask(this.queue.shift());
    }

    setTimeout(() => this.clean(), this.cleanRate);
  }

  /**
   * Returns wether the thread is currently in use.
   *
   * This is true when the thread's worker is currently processing a task.
   *
   * @returns If the thread is currently in use.
   */
  getInUse() {
    return this.inUse;
  }

  /**
   * A thread is free when it is not in use or the queue size is below the thread's maximum queue size
   *
   * @returns true/false depending on if the thread is free
   */
  isFree() {
    return !this.inUse || this.queue.length < this.maxQueueSize;
  }

  /**
   * Gets the number of task in the thread's queue.
   *
   * @returns The length of the thread's queue.
   */
  getNumInQueue() {
    return this.queue.length;
  }

  /**
   * Gets the thread's id.
   *
   * @returns The thread's id
   */
  getId() {
    return this.id;
  }

  /**
   * Prepends a console.log call with the thread's id.
   *
   * @param params Params for `console.log`
   */
  private log(...params: any) {
    console.log(`[${this.id}]:`, ...params);
  }
}
