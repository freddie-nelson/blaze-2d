import Blaze from "../lib/src/blaze";
import ChunkController from "../lib/src/chunk/controller";
import Tilesheet from "../lib/src/tilesheet";
import { createBuildAndBreakHandler } from "../lib/src/dropins/player/blockPicking";
import { createVirtualJoystick } from "../lib/src/dropins/player/controls";
import { addKeyListener } from "../lib/src/keyboard";
import { isMouseDown, Mouse } from "../lib/src/mouse";

const blz = new Blaze(<HTMLCanvasElement>document.getElementById("canvas"));

const player = blz.setPlayer({
  movement: {
    preserveMomentumDirection: true,
  },
});

player.getCamera().setFov(blz.gl, 90);

// setup chunk controller
const chunkController = new ChunkController({
  gl: blz.gl,
  object: player,
  camera: player.getCamera(),
  worldSize: 10000,
  renderDist: 16,
  chunksPerTick: 2,
  bedrock: -127,
  chunkSize: 8,
  chunkHeight: 127,
});
chunkController.setTilesheet(new Tilesheet(blz.gl, "tilesheet.png", 16, 22));
blz.addSystem(chunkController);

const generator = chunkController.getChunkGenerator();
generator.addGenerator((chunk, pos) => {
  chunk.fill(1);
});

player.enableBlockPicking(
  chunkController,
  128,
  createBuildAndBreakHandler(blz, {
    buildDelay: 0,
    breakDelay: 0,

    canBreak: () => isMouseDown(Mouse.LEFT),
    canBuild: () => isMouseDown(Mouse.RIGHT),

    onBreak: (i, chunk) => (chunk[i] = 0),
    onBuild: (i, chunk) => (chunk[i] = 1),
  })
);

if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
  player.useTouchControls();
  createVirtualJoystick(document.body, player);
}

// optifine like zoom
addKeyListener("KeyC", (pressed) => {
  const camera = player.getCamera();

  if (pressed) {
    camera.setFov(blz.gl, 30);
  } else {
    camera.setFov(blz.gl, 70);
  }
});

blz.setSkyColor("skyblue");

blz.toggleDebug();
blz.start();
