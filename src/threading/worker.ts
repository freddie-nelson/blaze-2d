import GeometryGenerator from "../chunk/geometry";
import { Neighbours } from "../object3d";
import { ThreadTaskData, ThreadTaskDataObject } from "./thread";

export interface WorkerMessage {
  task:
    | "chunk-generation"
    | "init-chunk-generator"
    | "chunk-geometry"
    | "init-geometry-generator"
    | "completed";
  data?: ThreadTaskData | ThreadTaskData[] | ThreadTaskDataObject;
}

export interface BLZWorker extends Worker {
  postMessage: (data: WorkerMessage) => void;
  onmessage: (e: { data: WorkerMessage }) => void;
}

const ctx: BLZWorker = <any>self;

class BlazeWorker {
  geometryGenerator: GeometryGenerator;

  constructor() {}

  handleTask(task: WorkerMessage) {
    let data;
    switch (task.task) {
      case "init-geometry-generator":
        const arr = task.data as Uint16Array;
        this.geometryGenerator = new GeometryGenerator({
          chunkSize: arr[0],
          chunkHeight: arr[1],
          excludeList: new Uint8Array(arr.slice(2)),
        });
        break;
      case "chunk-geometry":
        if (this.geometryGenerator) data = this.chunkGeometry(task.data as any);
        else
          throw new Error(
            "Worker: 'init-geometry-generator' must be executed at least once on a worker before 'chunk-geometry' can be executed."
          );
        break;
    }

    ctx.postMessage({ task: "completed", data });
  }

  handleMessage(msg: WorkerMessage) {
    switch (msg.task) {
      case "init-chunk-generator":
      case "init-geometry-generator":
      case "chunk-generation":
      case "chunk-geometry":
        if (msg.data) this.handleTask(msg);
        else throw new Error("Worker: Message must include data for chunk-generation and chunk-geometry.");
        break;
      default:
        break;
    }
  }

  chunkGeometry(data: { chunk: Uint8Array; neighbours: Neighbours<Uint8Array> }) {
    try {
      return this.geometryGenerator.generateChunkGeometryGPU(data.chunk, data.neighbours);
    } catch (error) {
      console.log("Worker: Error while generating chunk geometry.\n", data.chunk);
    }
  }
}

const worker = new BlazeWorker();
ctx.onmessage = (e) => {
  worker.handleMessage(e.data as WorkerMessage);
};
