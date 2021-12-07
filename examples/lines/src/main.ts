import Blaze from "@blz/blaze";
import Renderer from "@blz/renderer/renderer";
import BatchRenderer from "@blz/renderer/batchRenderer";
import World from "@blz/world";
import Physics from "@blz/physics/physics";
import LineCollider from "@blz/physics/collider/line";
import Line from "@blz/shapes/line";
import Circle from "@blz/shapes/circle";
import CircleCollider from "@blz/physics/collider/circle";
import GradientTexture, { GradientDirection, GradientType } from "@blz/texture/gradient";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import TextureLoader from "@blz/texture/loader";
import Debug from "@blz/debug";
import { addMouseListener, Mouse } from "@blz/mouse";
import { addKeyListener, isKeyPressed } from "@blz/keyboard";
import Color, { RGBAColor } from "@blz/utils/color";
import { vec2 } from "gl-matrix";
import Entity from "@blz/entity";
import RectCollider from "@blz/physics/collider/rect";

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
Blaze.addSystem(PHYSICS, true);

// setup debug menu
Debug.world = WORLD;
Blaze.toggleDebug();
WORLD.debug = true;
// PHYSICS.debug = true;

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
const ATLAS = new TextureAtlas(2000);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;
Debug.rendererToggle.checked = true;

// textures
const lineTex = new Texture(new Color("black"));
ATLAS.addTexture(lineTex, true);

// menu
const menu = document.createElement("div");
menu.style.cssText = `
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: .5rem;
  background: white;
`;

const textCSS = `
  font-family: Arial;
  font-weight: bold;
  font-size: 1.3rem;
  color: gray;
  margin: .2rem 0;
`;

const circlePara = document.createElement("p");
circlePara.style.cssText = textCSS;
circlePara.textContent = "Press 'C' to create circles.";

const weightContainer = document.createElement("div");
weightContainer.style.cssText = "display: flex;";

const weightPara = document.createElement("p");
weightPara.style.cssText = textCSS + "margin-right: .4rem;";
weightPara.textContent = "Weight: ";

const weightInput = document.createElement("input");
weightInput.type = "number";
weightInput.value = "0.15";

weightContainer.appendChild(weightPara);
weightContainer.appendChild(weightInput);

menu.appendChild(circlePara);
menu.appendChild(weightContainer);
document.body.appendChild(menu);

// start line on left click
let line: Line;
let collider: LineCollider;
let entity: Entity;

addMouseListener(Mouse.LEFT, (pressed, pixelPos) => {
  if (pressed) {
    const start = WORLD.getCellFromPixel(pixelPos);

    if (isKeyPressed("KeyC")) {
      const circle = new Circle(1, vec2.create());
      circle.texture = lineTex;

      const collider = new CircleCollider(1, start);
      const circleEntity = new Entity(start, collider, [circle]);
      WORLD.addEntity(circleEntity);
      PHYSICS.addBody(circleEntity);
      return;
    }

    line = new Line(start, start, Number(weightInput.value));
    line.texture = lineTex;

    collider = new LineCollider(start, start, Number(weightInput.value));

    entity = new Entity(line.getPosition(), collider, [line], 0);
    entity.isStatic = true;
    entity.setInertia(0);

    WORLD.addEntity(entity);
    PHYSICS.addCollisionObj(entity);
  } else {
    line = undefined;
    collider = undefined;
    entity = undefined;
  }
});

// live update line end
addMouseListener(Mouse.MOVE, (pressed, pixelPos) => {
  if (!line) return;

  line.setEnd(WORLD.getCellFromPixel(pixelPos));
  collider.setEnd(WORLD.getCellFromPixel(pixelPos));

  // move entity to line's world position and line to (0, 0) local position inside entity
  entity.setPosition(line.getPosition());
  line.setPosition(vec2.create());
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
