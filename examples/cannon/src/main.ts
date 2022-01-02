import Blaze from "@blz/blaze";
import BatchRenderer from "@blz/renderer/batchRenderer";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import Color, { RGBAColor } from "@blz/utils/color";
import { glMatrix, vec2 } from "gl-matrix";
import Entity from "@blz/entity";
import { Mouse } from "@blz/input/mouse";
import RectCollider from "@blz/physics/collider/rect";
import TriangleCollider from "@blz/physics/collider/triangle";
import CircleCollider from "@blz/physics/collider/circle";
import Rect from "@blz/shapes/rect";
import Triangle from "@blz/shapes/triangle";
import Circle from "@blz/shapes/circle";
import MouseConstraint from "@blz/physics/constraints/mouse";
import Editor, { EDITOR_GRID_SIZE } from "@blz/editor/editor";
import PivotConstraint from "@blz/physics/constraints/pivot";
import RotarySpringConstraint from "@blz/physics/constraints/rotarySpring";
import createBounds from "@helpers/bounds";

// setup engine
Blaze.init(document.querySelector("canvas"));
Blaze.setBgColor(new Color("skyblue"));
Blaze.start();

const CANVAS = Blaze.getCanvas();
const SCENE = Blaze.getScene();
const WORLD = SCENE.world;
const PHYSICS = SCENE.physics;

// const EDITOR = new Editor();
// Blaze.editor = EDITOR;

// MAIN
// setup atlas
const ATLAS = new TextureAtlas(4096);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

// textures
const boundsTex = new Texture(new Color("#222222"));
const crateTex = new Texture(new Color("#79634D"));
const barrelTex = new Texture(new Color("#929497"));
const legTex = new Texture(new Color("#79634D"));
const ballTex = new Texture(new Color("#222222"));

ATLAS.addTextures(boundsTex, crateTex, barrelTex, legTex, ballTex);

// load images onto textures
(async () => {
  await crateTex.loadImage("crate.jpg");
  await barrelTex.loadImage("barrel.png");
  await legTex.loadImage("leg.jpg");
  await ballTex.loadImage("cannon-ball.png");
  await ATLAS.refreshAtlas();
})();

// create boundaries
const thickness = 2;
const BOUNDS = createBounds(thickness, boundsTex);

// crate pyramid
const size = 1;
const mass = 1;
const base = Math.min(Math.floor(BOUNDS.width / size / 3), 14);
const diff = 1;
const spacing = 0.5;
const startX = BOUNDS.max[0] - thickness - size / 2 + (spacing * base) / 2;
const startY = BOUNDS.min[1] + thickness / 2 + size / 2;

for (let row = 0; row < base; row += diff) {
  for (let col = 0; col < base - row; col++) {
    const x = startX - col * size - (row * size) / 2 - (spacing * base) / 2 - spacing * (col + row / 2);
    const y = startY + (row / diff) * size;

    const rect = new Rect(size, size);
    rect.texture = crateTex;

    const crate = new Entity(vec2.fromValues(x, y), new RectCollider(size, size), [rect], mass);
    crate.staticFriction = 0.5;
    crate.dynamicFriction = 0.5;

    WORLD.addEntity(crate);
    PHYSICS.addBody(crate);
  }
}

// cannon legs
const legWidth = 2.6;
const legHeight = 2.4;
const legTri = new Triangle(legWidth, legHeight);
legTri.texture = legTex;

const leg = new Entity(
  vec2.add(
    vec2.create(),
    BOUNDS.min,
    vec2.fromValues(thickness / 2 + Math.max(BOUNDS.width / 10, 3), thickness / 2 + legHeight / 2),
  ),
  new TriangleCollider(legWidth, legHeight),
  [legTri],
  0,
);
leg.isStatic = true;

WORLD.addEntity(leg);

// cannon barrel
const barrelLength = 4.8;
const barrelHeight = 1.5;
const barrelRect = new Rect(barrelLength, barrelHeight);
barrelRect.texture = barrelTex;

const barrel = new Entity(leg.getPosition(), new RectCollider(barrelLength, barrelHeight), [barrelRect], 100);

WORLD.addEntity(barrel);
PHYSICS.addBody(barrel);

// cannon pivot joint
const cannonJoint = new PivotConstraint(barrel, leg.getPosition());
cannonJoint.anchorA = vec2.fromValues(0, -barrelHeight / 1.3);
PHYSICS.addConstraint(cannonJoint);

// cannon rotary spring
const cannonSpring = new RotarySpringConstraint(barrel, 0, 4000, 80);
PHYSICS.addConstraint(cannonSpring);

// track mouse with cannon
const minAngle = glMatrix.toRadian(-40);
const maxAngle = glMatrix.toRadian(50);

CANVAS.mouse.addListener(Mouse.MOVE, (pressed, pixelPos) => {
  const point = WORLD.getCellFromPixel(pixelPos);
  const diff = vec2.sub(vec2.create(), point, barrel.getPosition());
  const angle = Math.atan2(diff[1], diff[0]);

  cannonSpring.angle = Math.max(minAngle, Math.min(angle, maxAngle));
});

// shoot cannonballs on click
const ballMass = 20;
const ballSize = 0.5;
const minForce = 2000 * ballMass;
const maxForce = 6000 * ballMass;
const strength = 400 * ballMass;

CANVAS.mouse.addListener(Mouse.LEFT, (pressed, pixelPos) => {
  if (!pressed) return;

  const point = WORLD.getCellFromPixel(pixelPos);
  const diff = vec2.sub(vec2.create(), point, barrel.getPosition());
  const len = vec2.len(diff);

  const power = Math.max(minForce, Math.min(len * strength, maxForce));
  const dir = vec2.rotate(vec2.create(), vec2.fromValues(1, 0), vec2.create(), barrel.getRotation());

  const ballCircle = new Circle(ballSize);
  ballCircle.texture = ballTex;

  const ball = new Entity(
    vec2.scaleAndAdd(vec2.create(), barrel.getPosition(), dir, barrelLength / 2.5),
    new CircleCollider(ballSize),
    [ballCircle],
    ballMass,
  );
  WORLD.addEntity(ball);
  PHYSICS.addBody(ball);

  ball.applyForce(vec2.scale(vec2.create(), dir, power));
  barrel.applyForce(vec2.scale(vec2.create(), dir, (-power / ballMass) * 3));
});
