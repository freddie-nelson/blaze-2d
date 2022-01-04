import Blaze from "@blz/blaze";
import BatchRenderer from "@blz/renderer/batchRenderer";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import Color, { RGBAColor } from "@blz/utils/color";
import { vec2 } from "gl-matrix";
import Editor from "@blz/editor/editor";
import createBounds from "@helpers/bounds";
import { mousePicker } from "@helpers/mouse";
import Fluid from "@blz/physics/fluid/fluid";
import Rect from "@blz/shapes/rect";
import Entity from "@blz/entity";
import RectCollider from "@blz/physics/collider/rect";

// setup engine
Blaze.init(document.querySelector("canvas"));
Blaze.setBgColor(new Color("skyblue"));
Blaze.start();

const CANVAS = Blaze.getCanvas();
const SCENE = Blaze.getScene();
const WORLD = SCENE.world;
const PHYSICS = SCENE.physics;

const EDITOR = new Editor();
Blaze.editor = EDITOR;

// MAIN
// setup atlas
const ATLAS = new TextureAtlas(1024);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

// textures
const boundsTex = new Texture(new Color("grey"));
const fluidTex = new Texture(new Color("#1D7BE3"));

ATLAS.addTextures(boundsTex, fluidTex);

// create demo scene
const thickness = 2;
const BOUNDS = createBounds(thickness, boundsTex);

// add fluid
const particleRadius = 0.3;
const fluid = new Fluid({
  restDensity: 20 * particleRadius,
  smoothingRadius: particleRadius * 5.5,
  stiffness: 10,
  stiffnessNear: 80,

  particleRadius: particleRadius,
  maxParticles: 400,
  collisionGroup: 1,

  // debug: true,
  // debugTex: fluidTex,
});

const xLimit = BOUNDS.width - thickness * 2;

while (true) {
  if (!fluid.addParticle(vec2.fromValues(Math.random() * xLimit - xLimit / 2, Math.random() * 3))) break;
}

WORLD.addFluid(fluid);
PHYSICS.addFluid(fluid);

// add rect
// const rect = new Rect(2, 1);
// rect.texture = boundsTex;
// const entity = new Entity(vec2.create(), new RectCollider(2, 1), [rect], 10);

// WORLD.addEntity(entity);
// PHYSICS.addBody(entity);

// pick entity on click
mousePicker(() => undefined, "bounds");
