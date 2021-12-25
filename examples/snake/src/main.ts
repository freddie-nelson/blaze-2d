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

// setup engine
Blaze.init(document.querySelector("canvas"));
Blaze.setBgColor(new Color("#8ECC39"));
Blaze.start();

const CANVAS = Blaze.getCanvas();
const SCENE = Blaze.getScene();
const WORLD = SCENE.world;
const PHYSICS = SCENE.physics;

WORLD.cellSize = vec2.fromValues(25, 25);

// setup atlas
const ATLAS = new TextureAtlas(2000);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

// MAIN
const randInt = (min = 0, max = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

declare global {
  var GRID: { min: vec2; max: vec2; width: number; height: number };
}

const min = WORLD.getCellFromPixel(vec2.fromValues(0, window.innerHeight));
const max = WORLD.getCellFromPixel(vec2.fromValues(window.innerWidth, 0));

globalThis.GRID = {
  min,
  max,
  width: max[0] * 2,
  height: max[1] * 2,
};

// textures
const snakeTex = new Texture(new Color("#1A73E8"));
ATLAS.addTexture(snakeTex);

const appleTex = new Texture(new Color("#E94325"));
ATLAS.addTexture(appleTex);

const leafTex = new Texture(new Color("#40844F"));
ATLAS.addTexture(leafTex, true);

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
