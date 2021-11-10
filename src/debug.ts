import LZUTF8 from "lzutf8";
import Blaze from "./blaze";
import ChunkParser from "./chunk/parser";
import Player from "./player";
import World from "./world";

export default abstract class Debug {
  private static ready = false;
  private static enable = false;
  static show = true;

  static player: Player;
  static world: World;

  // elements
  static container: HTMLDivElement;
  static fps: HTMLSpanElement;
  static coords: HTMLSpanElement;
  static chunk: HTMLSpanElement;
  static chunks: HTMLSpanElement;
  static queued: HTMLSpanElement;
  static camera: HTMLSpanElement;
  static viewport: HTMLSpanElement;
  static threads: HTMLSpanElement;

  static lineMode: HTMLInputElement;

  static reloadChunks: HTMLButtonElement;
  static fullscreenBtn: HTMLButtonElement;
  static exportBtn: HTMLButtonElement;
  static importBtn: HTMLButtonElement;
  static showBtn: HTMLButtonElement;

  static init() {
    if (this.ready) return;
    this.ready = true;

    const container = document.createElement("div");
    container.setAttribute(
      "style",
      "position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; background-color: rgba(0, 0, 0, 0.5); padding: 8px; border-radius: 4px; z-index: 2;"
    );

    this.container = container;

    this.fps = this.createText();
    this.coords = this.createText();
    this.chunk = this.createText();
    this.chunks = this.createText();
    this.queued = this.createText();
    this.threads = this.createText();
    this.camera = this.createText();
    this.viewport = this.createText();

    this.lineMode = this.createToggle("Draw Lines: ", (val) => {
      // val
      //   ? blz.getChunkController().setDrawMode(WebGL2RenderingContext.LINES)
      //   : blz.getChunkController().setDrawMode(WebGL2RenderingContext.TRIANGLES);
    });
    this.reloadChunks = this.createButton("Reload Chunks", () => {
      // blz.getChunkController().refreshAllChunks();
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
      // const chunks = this.blz.getChunkController().getChunks();
      // const str = ChunkParser.chunksToString(chunks);
      // localStorage.setItem("debug_chunks", str);
    });

    this.importBtn = this.createButton("Import Chunks", () => {
      const str = localStorage.getItem("debug_chunks");
      if (!str) return;

      // const chunks = ChunkParser.stringToChunks(str);
      // this.blz.getChunkController().setChunks(chunks);
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

    this.showBtn.click();
  }

  static update(delta: number) {
    if (!Debug.show || !Debug.enable) return;

    const player = this.player;
    const position = player?.getPosition();

    if (position)
      this.coords.textContent = `Position { x: ${position[0].toFixed(1)}, y: ${position[1].toFixed(1)} }`;

    const world = this.world;
    const camera = world?.getCamera();

    if (camera)
      this.camera.textContent = `Camera { center: { x: ${camera.getPosition()[0]}, y: ${
        camera.getPosition()[1]
      } }`;

    if (camera) {
      const viewport = camera.viewport;
      const bounds = viewport.getBoundaries();

      this.viewport.textContent = `Viewport: { left: ${bounds.left}, right: ${bounds.right}, top: ${bounds.top}, bottom: ${bounds.bottom} }`;
    }

    // const chunkController = this.blz.getChunkController();
    // if (!chunkController) return;

    // const chunk = chunkController.getChunk(position);
    // chunk.x -= chunkController.getChunkOffset();
    // chunk.y -= chunkController.getChunkOffset();

    this.fps.textContent = `FPS: ${(1 / delta).toFixed(1)}`;

    // const neighbours = chunkController.getChunkNeighbours(chunk);
    // const emptyNeighbours = Object.keys(neighbours).map((k) => {
    //   if (neighbours[k] && neighbours[k][0] === 0) return k;
    // });
    // this.chunk.textContent = `Chunk { x: ${chunk.x}, y: ${chunk.y}, isEmpty: ${
    //   chunkController.chunks[`${chunk.x} ${chunk.y}`] &&
    //   chunkController.chunks[`${chunk.x} ${chunk.y}`][0] === 0
    // }, emptyNs: ${emptyNeighbours} }`;
    // this.chunk.textContent = `Chunk { x: ${chunk.x}, y: ${chunk.y} }`;

    // this.chunks.textContent = `Chunks { loaded: ${
    // Object.keys(chunkController.getChunks()).length
    // }, drawn: ${chunkController.getDrawn()} }`;

    // this.queued.textContent = `Queued { render: ${chunkController.getRenderQueueLength()}, generation: ${chunkController.getQueueLength()} }`;

    this.threads.textContent = `Threads { poolQueue: ${Blaze.getThreadPool().getQueueLength()}, ${Blaze.getThreadPool().threads.map(
      (t) => `${t.getId()}: ${t.getNumInQueue()}`
    )} }`;
  }

  static toggle() {
    if (this.enable) {
      this.container.remove();
    } else {
      document.body.appendChild(this.container);
    }

    this.enable = !this.enable;
  }

  static dispose() {
    document.body.removeChild(this.container);
  }

  private static createText() {
    const text = document.createElement("span");
    text.setAttribute(
      "style",
      "font-family: monospace; font-size: .8rem; color: white; margin: 4px 0; width: 300px;"
    );
    this.container.appendChild(text);
    return text;
  }

  private static createToggle(text: string, cb: (val: boolean) => void) {
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

  private static createButton(text: string, cb: () => void) {
    const btn = document.createElement("button");
    btn.setAttribute("style", "font-family: monospace; font-size: .8rem; color: black;  margin: 4px 0;");
    btn.innerText = text;
    btn.addEventListener("click", cb);
    this.container.appendChild(btn);
    return btn;
  }
}
