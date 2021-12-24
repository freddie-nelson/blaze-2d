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

const GRID = {
  min: WORLD.getCellFromPixel(vec2.fromValues(0, window.innerHeight)),
  max: WORLD.getCellFromPixel(vec2.fromValues(window.innerWidth, 0)),
};

// textures
const snakeTex = new Texture(new Color("#1A73E8"));
ATLAS.addTexture(snakeTex);

const appleTex = new Texture(new Color("#E94325"));
ATLAS.addTexture(appleTex, true);

const snake = new Snake(snakeTex);
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();
snake.eat();

WORLD.addEntity(snake);
