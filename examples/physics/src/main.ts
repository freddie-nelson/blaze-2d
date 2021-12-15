import Blaze from "@blz/blaze";
import Editor from "@blz/editor/editor";
import EditorCameraControls from "@blz/dropins/camera/editorControls";
import BatchRenderer from "@blz/renderer/batchRenderer";
import Entity from "@blz/entity";
import RectCollider from "@blz/physics/collider/rect";
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
import Color, { RGBAColor } from "@blz/utils/color";
import { vec2 } from "gl-matrix";
import { Mouse } from "@blz/input/mouse";

const BG_COLOR = new Color("skyblue");

// setup engine
Blaze.init(<HTMLCanvasElement>document.getElementById("canvas"));
Blaze.setBgColor(BG_COLOR);
Blaze.start();

// setup editor
const EDITOR = new Editor();
Blaze.editor = EDITOR;

const CANVAS = Blaze.getCanvas();
const SCENE = Blaze.getScene();
const WORLD = SCENE.world;
const PHYSICS = SCENE.physics;
const CAMERA = WORLD.getCamera();
const CAMERA_CONTROLS = new EditorCameraControls(CAMERA, CANVAS.element);

// MAIN
const randInt = (min = 0, max = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// setup atlas
const ATLAS = new TextureAtlas(2000);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

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
    { offset: 1, color: new Color(endColor) },
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

const floorCollider = new RectCollider(FLOOR_WIDTH, FLOOR_HEIGHT, floorPos);
const floorRect = new Rect(FLOOR_WIDTH, FLOOR_HEIGHT);
floorRect.texture = floorTex;

const floor = new Entity(floorPos, floorCollider, [floorRect], 0);
floor.setInertia(0);
floor.isStatic = true;

WORLD.addEntity(floor);
PHYSICS.addBody(floor);

// left wall
const leftPos = vec2.fromValues(-FLOOR_WIDTH / 2, 0);
const leftCollider = new RectCollider(FLOOR_HEIGHT, FLOOR_WIDTH, leftPos);
const leftRect = new Rect(FLOOR_HEIGHT, FLOOR_WIDTH);
leftRect.texture = floorTex;

const left = new Entity(leftPos, leftCollider, [leftRect], 0);
left.setInertia(0);
left.isStatic = true;

WORLD.addEntity(left);
PHYSICS.addBody(left);

// right wall
const rightPos = vec2.fromValues(FLOOR_WIDTH / 2, 0);
const rightCollider = new RectCollider(FLOOR_HEIGHT, FLOOR_WIDTH, rightPos);
const rightRect = new Rect(FLOOR_HEIGHT, FLOOR_WIDTH);
rightRect.texture = floorTex;

const right = new Entity(rightPos, rightCollider, [rightRect], 0);
right.setInertia(0);
right.isStatic = true;

WORLD.addEntity(right);
PHYSICS.addBody(right);

// toggles
let ROTATE = false;
CANVAS.keys.addListener("KeyR", (pressed) => {
  ROTATE = pressed;
});

let TYPE = "rect";
CANVAS.keys.addListener("KeyC", (pressed) => {
  if (pressed) {
    TYPE = "circle";
  } else {
    TYPE = "rect";
  }
});

CANVAS.keys.addListener("KeyT", (pressed) => {
  if (pressed) {
    TYPE = "triangle";
  } else {
    TYPE = "rect";
  }
});

// generate random shapes on click
CANVAS.mouse.addListener(Mouse.LEFT, (pressed, pixelPos) => {
  if (!pressed) return;

  const pos = WORLD.getCellFromPixel(pixelPos);

  const maxSize = 1;
  const minSize = 1;
  const size = vec2.fromValues(randInt(minSize, maxSize), randInt(minSize, maxSize));
  const mass = randInt(1, 1) * size[0];
  const inertia = mass;
  const tex = shapeTexs[randInt(0, shapeTexs.length - 1)];

  let shape: Shape;
  let collider: Collider;

  if (TYPE === "rect") {
    shape = new Rect(size[0], size[1]);
    collider = new RectCollider(size[0], size[1]);
  } else if (TYPE === "circle") {
    shape = new Circle(size[0] / 2);
    collider = new CircleCollider(size[0] / 2);
  } else if (TYPE === "triangle") {
    shape = new Triangle(size[0], size[1]);
    collider = new TriangleCollider(size[0], size[1]);
  }

  shape.texture = tex;

  const entity = new Entity(pos, collider, [shape], mass);
  entity.setInertia(inertia * 0.1);
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
});
