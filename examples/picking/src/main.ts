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
import MouseConstraint from "@blz/physics/constraints/mouse";

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
const floorTex = new Texture(new Color("grey"));
ATLAS.addTexture(floorTex);

const rectTex = new Texture(new Color("blue"));
ATLAS.addTexture(rectTex);

const pickedTex = new Texture(new Color("red"));
ATLAS.addTexture(pickedTex, true);

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

// pick entity on click
let picked: Entity;
let mouseConstraint: MouseConstraint;

CANVAS.mouse.addListener(Mouse.LEFT, (pressed, pixelPos) => {
  if (pressed && !picked) {
    const point = WORLD.getCellFromPixel(pixelPos);

    picked = <Entity>PHYSICS.pick(point)[0];
    if (picked === floor || !picked) return (picked = undefined);

    picked.getPieces()[0].texture = pickedTex;

    mouseConstraint = new MouseConstraint(picked);
    PHYSICS.addConstraint(mouseConstraint);
  } else if (picked) {
    picked.getPieces()[0].texture = rectTex;
    picked = undefined;

    mouseConstraint.remove();
    PHYSICS.removeConstraint(mouseConstraint);
    mouseConstraint = undefined;
  }
});
