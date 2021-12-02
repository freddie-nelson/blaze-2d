import Blaze from "@blz/blaze";
import Renderer from "@blz/renderer/renderer";
import BatchRenderer from "@blz/renderer/batchRenderer";
import World from "@blz/world";
import Physics from "@blz/physics/physics";
import Entity from "@blz/entity";
import BoxCollider from "@blz/physics/collider/box";
import TriangleCollider from "@blz/physics/collider/triangle";
import CircleCollider from "@blz/physics/collider/circle";
import Collider from "@blz/physics/collider/collider";
import Rect from "@blz/shapes/rect";
import Triangle from "@blz/shapes/triangle";
import Circle from "@blz/shapes/circle";
import Shape from "@blz/shapes/shape";
import Texture from "@blz/texture/texture";
import GradientTexture, { GradientDirection, GradientType } from "@blz/texture/gradient";
import TextureAtlas from "@blz/texture/atlas";
import TextureLoader from "@blz/texture/loader";
import Debug from "@blz/debug";
import testManifold from "@blz/physics/manifold.test";
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
Blaze.addSystem(PHYSICS, true);

// setup renderer
Renderer.useCamera(CAMERA);

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
const randGradient = () => {
  const startColor: RGBAColor = {
    r: randInt(0, 255),
    g: randInt(0, 255),
    b: randInt(0, 255),
  };
  const endColor: RGBAColor = {
    r: randInt(0, 255),
    g: randInt(0, 255),
    b: randInt(0, 255),
  };

  const tex = new GradientTexture(
    GradientType.LINEAR,
    GradientDirection.BOTTOM_TO_TOP,
    80,
    { offset: 0, color: new Color(startColor) },
    { offset: 1, color: new Color(endColor) }
  );
  tex.refresh();

  return tex;
};

const floorTex = new Texture(new Color("brown"));
ATLAS.addTexture(floorTex);

const shapeTexs: Texture[] = [];
for (let i = 0; i < 50; i++) {
  const tex = randGradient();
  shapeTexs.push(tex);
  ATLAS.addTexture(tex);
}

const debugTex = new Texture();
debugTex
  .loadImage("debug.png")
  .then(() => {
    ATLAS.addTexture(debugTex);
    ATLAS.refreshAtlas();
  })
  .catch((err) => console.log(err));

ATLAS.refreshAtlas();

// setup walls and floor

// floor
const FLOOR_WIDTH = 28;
const FLOOR_HEIGHT = 3;
const floorPos = vec2.fromValues(0, -10.5);

const floorCollider = new BoxCollider(FLOOR_WIDTH, FLOOR_HEIGHT, floorPos);
const floorRect = new Rect(FLOOR_WIDTH, FLOOR_HEIGHT);
floorRect.texture = floorTex;

const floor = new Entity(floorPos, floorCollider, [floorRect], 0);
floor.setInertia(0);
floor.isStatic = true;

WORLD.addEntity(floor);
PHYSICS.addBody(floor);

// left wall
const leftPos = vec2.fromValues(-FLOOR_WIDTH / 2, 0);
const leftCollider = new BoxCollider(FLOOR_HEIGHT, FLOOR_WIDTH, leftPos);
const leftRect = new Rect(FLOOR_HEIGHT, FLOOR_WIDTH);
leftRect.texture = floorTex;

const left = new Entity(leftPos, leftCollider, [leftRect], 0);
left.setInertia(0);
left.isStatic = true;

WORLD.addEntity(left);
PHYSICS.addBody(left);

// right wall
const rightPos = vec2.fromValues(FLOOR_WIDTH / 2, 0);
const rightCollider = new BoxCollider(FLOOR_HEIGHT, FLOOR_WIDTH, rightPos);
const rightRect = new Rect(FLOOR_HEIGHT, FLOOR_WIDTH);
rightRect.texture = floorTex;

const right = new Entity(rightPos, rightCollider, [rightRect], 0);
right.setInertia(0);
right.isStatic = true;

WORLD.addEntity(right);
PHYSICS.addBody(right);

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

const rotatePara = document.createElement("p");
rotatePara.style.cssText = textCSS;
rotatePara.textContent = "Press 'R' to randomize rotations.";

const circlePara = document.createElement("p");
circlePara.style.cssText = textCSS;
circlePara.textContent = "Press 'C' to create circles.";

const trianglePara = document.createElement("p");
trianglePara.style.cssText = textCSS;
trianglePara.textContent = "Press 'T' to create triangles.";

let bodyCount = 1;
const bodyCountPara = document.createElement("p");
bodyCountPara.style.cssText = textCSS;
bodyCountPara.textContent = `Bodies: ${bodyCount}`;

const wallsToggle = document.createElement("input");
wallsToggle.style.cssText = "margin-left: .5rem;";
wallsToggle.type = "checkbox";
wallsToggle.onclick = (e) => {
  const checked = wallsToggle.checked;
  if (checked) {
    WORLD.addEntity(left);
    PHYSICS.addBody(left);

    WORLD.addEntity(right);
    PHYSICS.addBody(right);
  } else {
    WORLD.removeEntity(left);
    PHYSICS.removeBody(left);

    WORLD.removeEntity(right);
    PHYSICS.removeBody(right);
  }
};
wallsToggle.checked = true;

const wallsTogglePara = document.createElement("p");
wallsTogglePara.style.cssText = textCSS;
wallsTogglePara.textContent = "Toggle walls: ";

const wallsToggleWrapper = document.createElement("div");
wallsToggleWrapper.style.cssText = "display: flex; align-items: center;";
wallsToggleWrapper.appendChild(wallsTogglePara);
wallsToggleWrapper.appendChild(wallsToggle);

menu.appendChild(bodyCountPara);
menu.appendChild(rotatePara);
menu.appendChild(circlePara);
menu.appendChild(trianglePara);
menu.appendChild(wallsToggleWrapper);
document.body.appendChild(menu);

// toggles
let ROTATE = false;
addKeyListener("KeyR", (pressed) => {
  ROTATE = pressed;
});

let TYPE = "rect";
addKeyListener("KeyC", (pressed) => {
  if (pressed) {
    TYPE = "circle";
  } else {
    TYPE = "rect";
  }
});

addKeyListener("KeyT", (pressed) => {
  if (pressed) {
    TYPE = "triangle";
  } else {
    TYPE = "rect";
  }
});

// generate random shapes on click
addMouseListener(Mouse.LEFT, (pressed, pixelPos) => {
  if (!pressed) return;

  const pos = WORLD.getCellFromPixel(pixelPos);

  const maxSize = 4;
  const minSize = 1;
  const size = vec2.fromValues(randInt(minSize, maxSize), randInt(minSize, maxSize));
  const mass = randInt(1, 5) * size[0];
  const tex = shapeTexs[randInt(0, shapeTexs.length - 1)];

  let shape: Shape;
  let collider: Collider;

  if (TYPE === "rect") {
    shape = new Rect(size[0], size[1]);
    collider = new BoxCollider(size[0], size[1], pos);
  } else if (TYPE === "circle") {
    shape = new Circle(size[0] / 2);
    collider = new CircleCollider(size[0] / 2, pos);
  } else if (TYPE === "triangle") {
    shape = new Triangle(size[0], size[1]);
    collider = new TriangleCollider(size[0], size[1], pos);
  }

  shape.texture = tex;

  const entity = new Entity(pos, collider, [shape], mass);
  // entity.restitution = 1;
  // entity.staticFriction = 1;
  // entity.dynamicFriction = 1;

  // rotations
  if (ROTATE) {
    const angle = (randInt(0, 360) * Math.PI) / 180;
    collider.setRotation(angle);
    entity.setRotation(angle);
  }

  WORLD.addEntity(entity);
  PHYSICS.addBody(entity);

  bodyCount++;
  bodyCountPara.textContent = `Bodies: ${bodyCount}`;
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
