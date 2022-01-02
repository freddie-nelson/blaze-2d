import Blaze from "@blz/blaze";
import BatchRenderer from "@blz/renderer/batchRenderer";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import Color from "@blz/utils/color";
import { vec2 } from "gl-matrix";
import Entity from "@blz/entity";
import RectCollider from "@blz/physics/collider/rect";
import CircleCollider from "@blz/physics/collider/circle";
import Rect from "@blz/shapes/rect";
import Circle from "@blz/shapes/circle";
import SpringConstraint from "@blz/physics/constraints/spring";
import DistanceConstraint from "@blz/physics/constraints/distance";
import PivotConstraint from "@blz/physics/constraints/pivot";
import MouseConstraint from "@blz/physics/constraints/mouse";
import { Mouse } from "@blz/input/mouse";
import { mousePicker } from "@helpers/mouse";

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
const anchorTex = new Texture(new Color("grey"));
const rectTex = new Texture(new Color("blue"));
ATLAS.addTextures(anchorTex, rectTex);

// create demo scene
// add anchor
const width = 10;
const anchorRect = new Rect(width, 3);
anchorRect.texture = anchorTex;

const anchor = new Entity(vec2.fromValues(-10, 9), new RectCollider(width, 3), [anchorRect], 0);
anchor.isStatic = true;

WORLD.addEntity(anchor);
PHYSICS.addBody(anchor);

// add body
const bodyRect = new Rect(4, 4);
bodyRect.texture = rectTex;

const body = new Entity(vec2.fromValues(-6, 4), new RectCollider(4, 4), [bodyRect], 10);
WORLD.addEntity(body);
PHYSICS.addBody(body);

// create constraint
const constraint = new DistanceConstraint(anchor, body, 8);
PHYSICS.addConstraint(constraint);

// constraint.anchorB = vec2.fromValues(-1, 2);

// body.applyForce(vec2.fromValues(200, 0));

// distance constraint at point
const point = vec2.fromValues(8, 0);
const spinnerRect = new Rect(8, 2);
spinnerRect.texture = rectTex;
const spinnerAnchor = vec2.fromValues(0, 1);
const spinner = new Entity(vec2.sub(vec2.create(), point, spinnerAnchor), new RectCollider(8, 2), [spinnerRect]);

WORLD.addEntity(spinner);
PHYSICS.addBody(spinner);

const pivot = new PivotConstraint(spinner, point);
PHYSICS.addConstraint(pivot);

pivot.anchorA = spinnerAnchor;

// create chain
const root = vec2.fromValues(10, 9);
const length = 8;
const stiffness = 10 * length;
const damping = 4;
const size = 0.3;
const spacing = size * 2;
const chain: Entity[] = [];

for (let i = 0; i < length; i++) {
  const shape = new Circle(size);
  shape.texture = rectTex;

  const entity = new Entity(vec2.fromValues(root[0], root[1] - i * spacing), new CircleCollider(size), [shape]);
  chain.push(entity);

  WORLD.addEntity(entity);
  PHYSICS.addBody(entity);

  if (i === 0) {
    const constraint = new PivotConstraint(entity, root);
    PHYSICS.addConstraint(constraint);
  } else {
    const constraint = new SpringConstraint(chain[i - 1], entity, spacing, stiffness, damping);
    PHYSICS.addConstraint(constraint);

    // constraint.anchorB = vec2.fromValues(0, 0);
  }

  entity.applyForceAtAngle(-10 * i, Math.PI / 2);
}

// setup mouse constraint
mousePicker(() => undefined, "bounds");
