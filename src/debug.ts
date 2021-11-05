import LZUTF8 from "lzutf8";
import Blaze from "./blaze";
import ChunkParser from "./chunk/parser";

export default class Debug {
  blz: Blaze;

  show = true;

  // elements
  container: HTMLDivElement;
  fps: HTMLSpanElement;
  coords: HTMLSpanElement;
  chunk: HTMLSpanElement;
  chunks: HTMLSpanElement;
  queued: HTMLSpanElement;
  camera: HTMLSpanElement;
  frustum: HTMLSpanElement;
  threads: HTMLSpanElement;

  lineMode: HTMLInputElement;

  reloadChunks: HTMLButtonElement;
  fullscreenBtn: HTMLButtonElement;
  exportBtn: HTMLButtonElement;
  importBtn: HTMLButtonElement;
  showBtn: HTMLButtonElement;

  constructor(blz: Blaze) {
    this.blz = blz;

    const container = document.createElement("div");
    container.setAttribute(
      "style",
      "position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; background-color: rgba(0, 0, 0, 0.5); padding: 8px; border-radius: 4px; z-index: 2;"
    );
    document.body.appendChild(container);
    this.container = container;

    this.fps = this.createText();
    this.coords = this.createText();
    this.chunk = this.createText();
    this.chunks = this.createText();
    this.queued = this.createText();
    this.threads = this.createText();
    this.camera = this.createText();
    this.frustum = this.createText();

    this.lineMode = this.createToggle("Draw Lines: ", (val) => {
      val
        ? blz.getChunkController().setDrawMode(WebGL2RenderingContext.LINES)
        : blz.getChunkController().setDrawMode(WebGL2RenderingContext.TRIANGLES);
    });
    this.reloadChunks = this.createButton("Reload Chunks", () => {
      blz.getChunkController().refreshAllChunks();
    });
    this.reloadChunks.id = "reload-btn";

    this.fullscreenBtn = this.createButton("Toggle Fullscreen", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    this.exportBtn = this.createButton("Export Chunks", () => {
      const chunks = this.blz.getChunkController().getChunks();
      const str = ChunkParser.chunksToString(chunks);

      localStorage.setItem("debug_chunks", str);
    });

    this.importBtn = this.createButton("Import Chunks", () => {
      const str = localStorage.getItem("debug_chunks");
      if (!str) return;

      const chunks = ChunkParser.stringToChunks(str);
      this.blz.getChunkController().setChunks(chunks);
    });

    this.showBtn = this.createButton("Show/Hide Menu", () => {
      this.show = !this.show;

      const children = Array.from(this.container.children);
      if (!this.show) {
        children.forEach((element: HTMLElement) => {
          if (element === this.showBtn) return;

          element.style.display = "none";
        });
      } else {
        children.forEach((element: HTMLElement) => {
          if (element === this.showBtn) return;

          element.style.display = "block";
        });
      }
    });
  }

  update(delta: number) {
    if (!this.show) return;

    const player = this.blz.getPlayer();
    const position = player.getPosition();
    const chunkController = this.blz.getChunkController();
    if (!chunkController) return;

    const chunk = chunkController.getChunk(position);
    chunk.x -= chunkController.getChunkOffset();
    chunk.y -= chunkController.getChunkOffset();

    this.fps.textContent = `FPS: ${(1 / delta).toFixed(1)}`;

    this.coords.textContent = `Position { x: ${position[0].toFixed(1)}, y: ${position[1].toFixed(
      1
    )}, z: ${position[2].toFixed(1)} }`;

    // const neighbours = chunkController.getChunkNeighbours(chunk);
    // const emptyNeighbours = Object.keys(neighbours).map((k) => {
    //   if (neighbours[k] && neighbours[k][0] === 0) return k;
    // });
    // this.chunk.textContent = `Chunk { x: ${chunk.x}, y: ${chunk.y}, isEmpty: ${
    //   chunkController.chunks[`${chunk.x} ${chunk.y}`] &&
    //   chunkController.chunks[`${chunk.x} ${chunk.y}`][0] === 0
    // }, emptyNs: ${emptyNeighbours} }`;
    this.chunk.textContent = `Chunk { x: ${chunk.x}, y: ${chunk.y} }`;

    this.chunks.textContent = `Chunks { loaded: ${
      Object.keys(chunkController.getChunks()).length
    }, drawn: ${chunkController.getDrawn()} }`;

    this.queued.textContent = `Queued { render: ${chunkController.getRenderQueueLength()}, generation: ${chunkController.getQueueLength()} }`;

    this.camera.textContent = `Camera { yaw: ${((player.getRotation()[1] / Math.PI) * 180).toFixed(2)} }`;

    this.threads.textContent = `Threads { poolQueue: ${this.blz.getThreadPool().getQueueLength()}, ${this.blz
      .getThreadPool()
      .threads.map((t) => `${t.getId()}: ${t.getNumInQueue()}`)} }`;

    // const frustum = player.camera.frustum;
    // this.frustum.textContent = `Frustum: { \n__${frustum.planeKeys
    //   .map((k) => {
    //     const plane = frustum.planes[k];
    //     return `${k[0]}: {${Object.keys(plane).reduce((acc, c) => {
    //       // @ts-expect-error
    //       acc += `${c}: ${plane[c].toFixed(2)},`;
    //       return acc;
    //     }, "")}}`;
    //   })
    //   .join("\n__")} \n}`;
  }

  dispose() {
    document.body.removeChild(this.container);
  }

  private createText() {
    const text = document.createElement("span");
    text.setAttribute(
      "style",
      "font-family: monospace; font-size: .8rem; color: white; margin: 4px 0; width: 300px;"
    );
    this.container.appendChild(text);
    return text;
  }

  private createToggle(text: string, cb: (val: boolean) => void) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.addEventListener("input", (e) => cb((e.target as HTMLInputElement).checked));
    const p = this.createText();
    p.textContent = text;
    p.style.display = "flex";
    p.style.alignItems = "center";
    p.style.marginTop = "-4px";
    box.style.marginLeft = "4px";
    p.appendChild(box);
    this.container.appendChild(p);
    return box;
  }

  private createButton(text: string, cb: () => void) {
    const btn = document.createElement("button");
    btn.setAttribute("style", "font-family: monospace; font-size: .8rem; color: black;  margin: 4px 0;");
    btn.innerText = text;
    btn.addEventListener("click", cb);
    this.container.appendChild(btn);
    return btn;
  }
}
