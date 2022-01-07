import Blaze from "@blz/blaze";
import BatchRenderer from "@blz/renderer/batchRenderer";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import Color, { RGBAColor } from "@blz/utils/color";
import { vec2 } from "gl-matrix";
import Editor from "@blz/editor/editor";
import createBounds from "@helpers/bounds";
import { mousePicker } from "@helpers/mouse";
import Circle from "@blz/shapes/circle";
import Entity from "@blz/entity";
import CircleCollider from "@blz/physics/collider/circle";
import DistanceConstraint from "@blz/physics/constraints/distance";
import { randomTexs } from "@helpers/textures";

// setup engine
Blaze.init(document.querySelector("canvas"));
Blaze.setBgColor(new Color("skyblue"));
Blaze.start();

const CANVAS = Blaze.getCanvas();
const SCENE = Blaze.getScene();
const WORLD = SCENE.world;
const PHYSICS = SCENE.physics;

// PHYSICS.CONFIG.VELOCITY_ITERATIONS = 100;
// PHYSICS.CONFIG.CONSTRAINT_ITERATIONS = 10;

// const EDITOR = new Editor();
// Blaze.editor = EDITOR;

// MAIN
// setup atlas
const ATLAS = new TextureAtlas(1024);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

// textures
const boundsTex = new Texture(new Color("grey"));
const pointTex = new Texture(new Color("white"));
ATLAS.addTextures(boundsTex, pointTex);

const circleTexs = randomTexs(20, ATLAS);

// create demo scene
const thickness = 2;
// const BOUNDS = createBounds(thickness, boundsTex);

// create cradle
const distance = 4;
const size = 1;
const mass = 1;
const count = 5;
const spacing = 0;
const top = distance / 2;
const force = 600 * mass;

for (let i = 0; i < count; i++) {
  const circle = new Circle(size);
  circle.texture = circleTexs[Math.floor(Math.random() * circleTexs.length)];

  const pos = vec2.fromValues(i * (size + spacing) * 2 - count * (size + spacing), top - distance);
  const entity = new Entity(pos, new CircleCollider(size), [circle], mass);
  entity.restitution = 0.95;
  entity.setInertia(0);
  entity.dynamicFriction = 0;
  entity.staticFriction = 0;
  entity.airFriction = 0.8;

  WORLD.addEntity(entity);
  PHYSICS.addBodies(entity);

  const point = vec2.fromValues(pos[0], top);
  const pointCircle = new Circle(0.1);
  const pointEntity = new Entity(point, new CircleCollider(0), [pointCircle]);
  pointCircle.texture = pointTex;

  WORLD.addEntity(pointEntity);

  const constraint = new DistanceConstraint(entity, point, distance);
  PHYSICS.addConstraint(constraint);

  if (i === count - 1) {
    entity.applyForce(vec2.fromValues(force, 0));
  }
}

// pick entity on click
mousePicker(() => undefined, "bounds");
