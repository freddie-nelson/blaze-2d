import Blaze from "@blz/blaze";
import Renderer from "@blz/renderer/renderer";
import BatchRenderer from "@blz/renderer/batchRenderer";
import World from "@blz/world";
import Physics from "@blz/physics/physics";
import Color from "@blz/utils/color";
import { vec2 } from "gl-matrix";

// constants
const CANVAS = <HTMLCanvasElement>document.getElementById("canvas");

const VIEWPORT_SIZE = vec2.fromValues(CANVAS.width, CANVAS.height);
const CELL_SIZE = vec2.fromValues(40, 40);
const BG_COLOR = new Color("skyblue");

const WORLD = new World(CELL_SIZE, VIEWPORT_SIZE);
const CAMERA = WORLD.getCamera();
const VIEWPORT = CAMERA.viewport;

const PHYSICS = new Physics();

// setup engine
Blaze.init(CANVAS);
Blaze.setBgColor(BG_COLOR);
Blaze.start();

window.addEventListener("resize", () => {
  Renderer.resizeToCanvas();

  VIEWPORT_SIZE[0] = CANVAS.width;
  VIEWPORT_SIZE[1] = CANVAS.height;
  VIEWPORT.setWidth(VIEWPORT_SIZE[0]);
  VIEWPORT.setHeight(VIEWPORT_SIZE[1]);
});

// add systems
Blaze.addSystem(WORLD);
Blaze.addSystem(PHYSICS);
