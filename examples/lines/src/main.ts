import Blaze from "@blz/blaze";
import Renderer from "@blz/renderer/renderer";
import BatchRenderer from "@blz/renderer/batchRenderer";
import World from "@blz/scene";
import Physics from "@blz/physics/physics";
import LineCollider from "@blz/physics/collider/line";
import Line from "@blz/shapes/line";
import Circle from "@blz/shapes/circle";
import CircleCollider from "@blz/physics/collider/circle";
import GradientTexture, { GradientDirection, GradientType } from "@blz/texture/gradient";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import TextureLoader from "@blz/texture/loader";
import Color, { RGBAColor } from "@blz/utils/color";
import { vec2 } from "gl-matrix";
import Entity from "@blz/entity";
import RectCollider from "@blz/physics/collider/rect";
import { Mouse } from "@blz/input/mouse";
import Editor from "@blz/editor/editor";

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
const randInt = (min = 0, max = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// setup atlas
const ATLAS = new TextureAtlas(2000);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

// textures
const lineTex = new Texture(new Color("black"));
ATLAS.addTexture(lineTex, true);

// menu
const menu = document.createElement("div");
menu.style.cssText = `
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: .5rem;
  background: white;
`;

const textCSS = `
  font-family: Arial;
  font-weight: bold;
  font-size: 1.3rem;
  color: gray;
  margin: .2rem 0;
`;

const circlePara = document.createElement("p");
circlePara.style.cssText = textCSS;
circlePara.textContent = "Press 'C' to create circles.";

const weightContainer = document.createElement("div");
weightContainer.style.cssText = "display: flex;";

const weightPara = document.createElement("p");
weightPara.style.cssText = textCSS + "margin-right: .4rem;";
weightPara.textContent = "Weight: ";

const weightInput = document.createElement("input");
weightInput.type = "number";
weightInput.value = "0.15";

weightContainer.appendChild(weightPara);
weightContainer.appendChild(weightInput);

menu.appendChild(circlePara);
menu.appendChild(weightContainer);
document.body.appendChild(menu);

// start line on left click
let line: Line;
let collider: LineCollider;
let entity: Entity;

CANVAS.mouse.addListener(Mouse.LEFT, (pressed, pixelPos) => {
  if (pressed) {
    const start = WORLD.getWorldFromPixel(pixelPos);

    if (CANVAS.keys.isPressed("KeyC")) {
      const circle = new Circle(1, vec2.create());
      circle.texture = lineTex;

      const collider = new CircleCollider(1, start);
      const circleEntity = new Entity(start, collider, [circle]);
      WORLD.addEntity(circleEntity);
      PHYSICS.addBody(circleEntity);
      return;
    }

    line = new Line(start, start, Number(weightInput.value));
    line.texture = lineTex;

    collider = new LineCollider(start, start, Number(weightInput.value));

    entity = new Entity(line.getPosition(), collider, [line], 0);
    entity.isStatic = true;
    entity.setInertia(0);

    WORLD.addEntity(entity);
    PHYSICS.addCollisionObj(entity);
  } else {
    line = undefined;
    collider = undefined;
    entity = undefined;
  }
});

// live update line end
CANVAS.mouse.addListener(Mouse.MOVE, (pressed, pixelPos) => {
  if (!line) return;

  line.setEnd(WORLD.getWorldFromPixel(pixelPos));
  collider.setEnd(WORLD.getWorldFromPixel(pixelPos));

  // move entity to line's world position and line to (0, 0) local position inside entity
  entity.setPosition(line.getPosition());
  line.setPosition(vec2.create());
});
