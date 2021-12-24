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

// setup engine
Blaze.init(document.querySelector("canvas"));
Blaze.setBgColor(new Color("skyblue"));
Blaze.start();

const CANVAS = Blaze.getCanvas();
const SCENE = Blaze.getScene();
const WORLD = SCENE.world;
const PHYSICS = SCENE.physics;

// MAIN
const randInt = (min = 0, max = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// setup atlas
const ATLAS = new TextureAtlas(2000);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

// textures
const rayTex = new Texture(new Color("black"));
ATLAS.addTexture(rayTex, true);

const floorTex = new Texture(new Color("grey"));
ATLAS.addTexture(floorTex);

const rectTex = new Texture(new Color("blue"));
ATLAS.addTexture(rectTex);

const highlightTex = new Texture(new Color("red"));
ATLAS.addTexture(highlightTex, true);

// create demo scene
// add floor
const floorRect = new Rect(30, 3);
floorRect.texture = floorTex;

const floor = new Entity(vec2.fromValues(0, -9), new RectCollider(30, 3), [floorRect], 0);
floor.isStatic = true;

WORLD.addEntity(floor);
PHYSICS.addBody(floor);

// add rects
const xRange = 20;
const yRange = 8;

for (let i = 0; i < 100; i++) {
  const x = Math.floor(Math.random() * xRange) - xRange / 2;
  const y = Math.floor(Math.random() * yRange) - yRange / 2;
  const rot = (Math.floor(Math.random() * 360) * Math.PI) / 180;

  const rect = new Rect(1, 1);
  rect.texture = rectTex;

  const collider = new RectCollider(1, 1);

  const entity = new Entity(vec2.fromValues(x, y), collider, [rect], 1);
  entity.rotate(rot);

  WORLD.addEntity(entity);
  PHYSICS.addBody(entity);
}

// raycast entities
const origin = vec2.fromValues(0, 9);
let ray: Ray;

let rayEntity = new Entity(vec2.create(), new RectCollider(0, 0));
rayEntity.setZIndex(1);
WORLD.addEntity(rayEntity);

// update ray on mouse move
CANVAS.mouse.addListener(Mouse.MOVE, (pressed, pixelPos) => {
  const pos = WORLD.getCellFromPixel(pixelPos);
  const length = vec2.len(vec2.sub(vec2.create(), pos, origin));

  const direction = vec2.sub(vec2.create(), pos, origin);
  vec2.normalize(direction, direction);

  ray = new Ray(origin, direction, length);

  // update ray entity
  rayEntity.getPieces().length = 0;

  const line = new Line(origin, direction, length, 0.08);
  line.texture = rayTex;
  rayEntity.addPiece(line);
});

// ray cast system
let changed: Entity[] = [];

Blaze.addSystem(
  {
    update() {
      // reset changed
      for (const entity of changed) {
        entity.getPieces()[0].texture = rectTex;
      }

      if (!ray) return;

      let results = <Entity[]>PHYSICS.raycast(ray);

      // highlight results
      for (const entity of results) {
        if (entity === floor) continue;

        entity.getPieces()[0].texture = highlightTex;
        changed.push(entity);
      }
    },
  },
  true,
);
