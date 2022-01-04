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
import createBounds from "@helpers/bounds";
import { boxGrid } from "@helpers/structures";
import { mousePicker } from "@helpers/mouse";
import { randomTexs } from "@helpers/textures";

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

const boundsTex = new Texture(new Color("grey"));
ATLAS.addTexture(boundsTex);

const rectTex = new Texture(new Color("blue"));
ATLAS.addTexture(rectTex);

const highlightTex = new Texture(new Color("red"));
ATLAS.addTexture(highlightTex, true);

// create demo scene
const thickness = 2;
const BOUNDS = createBounds(thickness, boundsTex);

// add rects
const size = 1;
const spacing = size / 20;
const cols = Math.min(25, Math.floor(BOUNDS.width / size - thickness) - 1);
const rows = 9;

const boxes = boxGrid(rectTex, size, size, rows, cols, spacing, 0, BOUNDS.min[1] + thickness / 2);
boxes.forEach((box) => {
  box.applyForceAtAngle(1000, Math.random() * Math.PI * 2);
});

// raycast entities
const origin = vec2.fromValues(0, 9);
let ray: Ray;

let rayEntity = new Entity(vec2.create(), new RectCollider(0, 0));
rayEntity.setZIndex(1);
WORLD.addEntity(rayEntity);

// update ray on mouse move
CANVAS.mouse.addListener(Mouse.MOVE, (pressed, pixelPos) => {
  const pos = WORLD.getWorldFromPixel(pixelPos);
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
        if (entity.name === "bounds") continue;

        entity.getPieces()[0].texture = highlightTex;
        changed.push(entity);
      }
    },
  },
  true,
);

// pick entity on click
mousePicker(() => undefined, "bounds");
