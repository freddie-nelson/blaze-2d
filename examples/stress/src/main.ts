import Blaze from "@blz/blaze";
import BatchRenderer from "@blz/renderer/batchRenderer";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import Color, { RGBAColor } from "@blz/utils/color";
import { vec2 } from "gl-matrix";
import Entity from "@blz/entity";
import { Mouse } from "@blz/input/mouse";
import RectCollider from "@blz/physics/collider/rect";
import Rect from "@blz/shapes/rect";
import MouseConstraint from "@blz/physics/constraints/mouse";
import Editor from "@blz/editor/editor";
import BlazeStat from "@blz/ui/stat";
import { TextStyle } from "@blz/ui/text";

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
const ATLAS = new TextureAtlas(1024);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

// textures
const floorTex = new Texture(new Color("grey"));
ATLAS.addTexture(floorTex);

const rectTexs = new Array(500).fill(undefined).map(() => {
  const color = new Color(<RGBAColor>{
    r: Math.floor(Math.random() * 255),
    g: Math.floor(Math.random() * 255),
    b: Math.floor(Math.random() * 255),
    a: 1,
  });

  const tex = new Texture(color);
  ATLAS.addTexture(tex);

  return tex;
});

const pickedTex = new Texture(new Color("red"));
ATLAS.addTexture(pickedTex, true);

// create demo scene
// add floor
const floorRect = new Rect(30, 3);
floorRect.texture = floorTex;

const floorLevel = -7.5;
const floor = new Entity(vec2.fromValues(0, -9), new RectCollider(30, 3), [floorRect], 0);
floor.isStatic = true;

WORLD.addEntity(floor);
PHYSICS.addBody(floor);

// add rects
const cols = 26;
const rows = 12;
const size = 1;
const spacing = size / 20;

for (let row = 0; row < rows; row++) {
  for (let col = 1; col < cols; col++) {
    const x = col * size - (cols * size) / 2 - (spacing * cols) / 2 + spacing * col;
    const y = floorLevel + size / 2 + row * size;

    const rect = new Rect(size, size);
    rect.texture = rectTexs[Math.floor(Math.random() * rectTexs.length)];

    const collider = new RectCollider(size, size);

    const entity = new Entity(vec2.fromValues(x, y), collider, [rect], size);

    WORLD.addEntity(entity);
    PHYSICS.addBody(entity);
  }
}

const bodyCount = new BlazeStat("Bodies", (cols - 1) * rows, 2, true, TextStyle.PRIMARY);
bodyCount.element.style.position = "absolute";
bodyCount.element.style.left = "1rem";
bodyCount.element.style.top = "1rem";
document.body.appendChild(bodyCount.element);

// pick entity on click
let mouseConstraint: MouseConstraint;

CANVAS.mouse.addListener(Mouse.LEFT, (pressed, pixelPos) => {
  if (pressed && !mouseConstraint) {
    const point = WORLD.getCellFromPixel(pixelPos);

    const picked = <Entity>PHYSICS.pick(point)[0];
    if (!picked) return;

    mouseConstraint = new MouseConstraint(picked);
    PHYSICS.addConstraint(mouseConstraint);
  } else if (mouseConstraint) {
    mouseConstraint.remove();
    PHYSICS.removeConstraint(mouseConstraint);
    mouseConstraint = undefined;
  }
});
