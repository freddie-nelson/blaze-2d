import Blaze from "@blz/blaze";
import BatchRenderer from "@blz/renderer/batchRenderer";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import Color from "@blz/utils/color";
import { vec2 } from "gl-matrix";
import Entity from "@blz/entity";
import { Mouse } from "@blz/input/mouse";
import RectCollider from "@blz/physics/collider/rect";
import Rect from "@blz/shapes/rect";
import Ray from "@blz/physics/ray";
import Line from "@blz/shapes/line";
import Snake from "./snake";
import Apple from "./apple";
import Editor from "@blz/editor/editor";
import Logger from "@blz/logger";
import Viewport from "@blz/camera/viewport";

// setup engine
Blaze.init(document.querySelector("canvas"));
Blaze.setBgColor(new Color("#8ECC39"));
Blaze.start();

// Blaze.editor = new Editor();

const CANVAS = Blaze.getCanvas();
const SCENE = Blaze.getScene();
const WORLD = SCENE.world;
const CAMERA = WORLD.getCamera();

WORLD.cellSize = vec2.fromValues(25, 25);
CAMERA.viewport = new Viewport(vec2.create(), CANVAS.element.clientWidth, CANVAS.element.clientHeight);

// setup atlas
const ATLAS = new TextureAtlas(2000);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

// MAIN
declare global {
  var GRID: { min: vec2; max: vec2; width: number; height: number };
}

const min = WORLD.getWorldFromPixel(vec2.fromValues(0, CANVAS.element.clientHeight));
const max = WORLD.getWorldFromPixel(vec2.fromValues(CANVAS.element.clientWidth, 0));

globalThis.GRID = {
  min,
  max,
  width: max[0] * 2,
  height: max[1] * 2,
};

// textures
const snakeTex = new Texture(new Color("#1A73E8"));
const appleTex = new Texture(new Color("#E94325"));
const leafTex = new Texture(new Color("#40844F"));

ATLAS.addTextures(snakeTex, appleTex, leafTex);

const snake = new Snake(snakeTex);
snake.eat();
snake.eat();
WORLD.addEntity(snake);

const appleCount = 12;
for (let i = 0; i < appleCount; i++) {
  WORLD.addEntity(new Apple(appleTex, leafTex));
}

// walls
const thickness = 1;

const top = new Entity(vec2.fromValues(0, GRID.max[1] + thickness / 2), new RectCollider(GRID.width, thickness));
const bottom = new Entity(vec2.fromValues(0, GRID.min[1] - thickness / 2), new RectCollider(GRID.width, thickness));
const right = new Entity(vec2.fromValues(GRID.max[0] + thickness / 2, 0), new RectCollider(thickness, GRID.height));
const left = new Entity(vec2.fromValues(GRID.min[0] - thickness / 2, 0), new RectCollider(thickness, GRID.height));

top.name = "wall";
bottom.name = "wall";
right.name = "wall";
left.name = "wall";

WORLD.addEntities(top, bottom, right, left);
