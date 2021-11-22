import Blaze from "@blz/blaze";
import Renderer from "@blz/renderer/renderer";
import BatchRenderer from "@blz/renderer/batchRenderer";
import World from "@blz/world";
import Physics from "@blz/physics/physics";
import Entity from "@blz/entity";
import Box from "@blz/physics/collider/box";
import Collider from "@blz/physics/collider/collider";
import Rect from "@blz/shapes/rect";
import Circle from "@blz/shapes/circle";
import Shape from "@blz/shapes/shape";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import Debug from "@blz/debug";
import { addMouseListener, Mouse } from "@blz/mouse";
import { addKeyListener } from "@blz/keyboard";
import Color, { RGBAColor } from "@blz/utils/color";
import { vec2 } from "gl-matrix";

// constants
const CANVAS = <HTMLCanvasElement>document.getElementById("canvas");

const VIEWPORT_SIZE = vec2.fromValues(CANVAS.clientWidth, CANVAS.clientHeight);
const CELL_SIZE = vec2.fromValues(40, 40);
const BG_COLOR = new Color("skyblue");

// setup engine
Blaze.init(CANVAS);
Blaze.setBgColor(BG_COLOR);
Blaze.start();

// setup systems
const WORLD = new World(CELL_SIZE, VIEWPORT_SIZE);
const CAMERA = WORLD.getCamera();
const VIEWPORT = CAMERA.viewport;

const PHYSICS = new Physics();

Blaze.addSystem(WORLD);
Blaze.addSystem(PHYSICS);

// setup renderer
Renderer.useCamera(CAMERA);

// setup debug menu
Debug.world = WORLD;
Blaze.toggleDebug();

// lock canvas to window size
window.addEventListener("resize", () => {
  Renderer.resizeToCanvas();

  VIEWPORT_SIZE[0] = CANVAS.width;
  VIEWPORT_SIZE[1] = CANVAS.height;
  VIEWPORT.setWidth(VIEWPORT_SIZE[0]);
  VIEWPORT.setHeight(VIEWPORT_SIZE[1]);
});

// MAIN
const randInt = (min = 0, max = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// setup atlas
const ATLAS = new TextureAtlas(8000);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;
Debug.rendererToggle.checked = true;

// textures
const floorTex = new Texture(new Color("brown"));
ATLAS.addTexture(floorTex);

const shapeTexs: Texture[] = [];
for (let i = 0; i < 100; i++) {
  const color: RGBAColor = {
    r: randInt(0, 255),
    g: randInt(0, 255),
    b: randInt(0, 255),
  };
  const tex = new Texture(new Color(color));
  shapeTexs.push(tex);
  ATLAS.addTexture(tex);
}

ATLAS.refreshAtlas();

// floor
const FLOOR_WIDTH = 28;
const FLOOR_HEIGHT = 3;
const floorCollider = new Box(FLOOR_WIDTH, FLOOR_HEIGHT);
const floorRect = new Rect(FLOOR_WIDTH, FLOOR_HEIGHT);
floorRect.texture = floorTex;

const floor = new Entity(vec2.fromValues(0, -9), floorCollider, [floorRect]);
WORLD.addEntity(floor);
PHYSICS.addBody(floor);

// generate random shapes on click
const type = "rect";

addMouseListener(Mouse.LEFT, (pressed, pixelPos) => {
  if (!pressed) return;

  const pos = WORLD.getCellFromPixel(pixelPos);

  const maxSize = 4;
  const minSize = 1;
  const size = vec2.fromValues(randInt(minSize, maxSize), randInt(minSize, maxSize));
  const tex = shapeTexs[randInt(0, shapeTexs.length - 1)];

  let shape: Shape;
  let collider: Collider;

  if (type === "rect") {
    shape = new Rect(size[0], size[1]);
    collider = new Box(size[0], size[1]);
  } else if (type === "circle") {
    shape = new Circle(size[0]);
    collider = new Box(size[0], size[0]);
  }

  shape.texture = tex;

  const entity = new Entity(pos, collider, [shape]);
  WORLD.addEntity(entity);
  PHYSICS.addBody(entity);
});

// pan camera with arrow keys
const panCamera = (pan: vec2) => {
  CAMERA.moveRight(pan[0]);
  CAMERA.moveUp(pan[1]);
};

const dist = 1;

addKeyListener("ArrowRight", (pressed) => {
  if (pressed) panCamera(vec2.fromValues(dist, 0));
});

addKeyListener("ArrowLeft", (pressed) => {
  if (pressed) panCamera(vec2.fromValues(-dist, 0));
});

addKeyListener("ArrowUp", (pressed) => {
  if (pressed) panCamera(vec2.fromValues(0, dist));
});

addKeyListener("ArrowDown", (pressed) => {
  if (pressed) panCamera(vec2.fromValues(0, -dist));
});
