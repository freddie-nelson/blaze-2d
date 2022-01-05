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
const rectTex = new Texture(new Color("#FDC731"));
const fluidTex = new Texture(new Color("#1D7BE3"));

ATLAS.addTextures(boundsTex, rectTex, fluidTex);

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
  maxParticles: 250,
  collisionGroup: 1,

  debug: true,
  debugTex: boundsTex,
});

const xLimit = BOUNDS.width - thickness * 2;

while (true) {
  if (!fluid.addParticle(vec2.fromValues(Math.random() * xLimit - xLimit / 2, Math.random() * 3))) break;
}

WORLD.addFluid(fluid);
PHYSICS.addFluid(fluid);

// add random rects
const rect1 = new Rect(2, 2);
rect1.texture = rectTex;
const entity1 = new Entity(vec2.fromValues(-3, 0), new RectCollider(2, 2), [rect1], 1);

const rect2 = new Rect(2, 2);
rect2.texture = rectTex;
const entity2 = new Entity(vec2.fromValues(3, 0), new RectCollider(2, 2), [rect2], 10);

// WORLD.addEntities(entity1, entity2);
// PHYSICS.addBodies(entity1, entity2);

// pick entity on click
mousePicker(() => undefined, "bounds");
