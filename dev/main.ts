import BLZ from "../lib/src/blaze";
import Renderer from "../lib/src/renderer/renderer";
import Tilesheet from "../lib/src/tilesheet";
import Texture from "../lib/src/texture/texture";
import Color, { RGBAColor } from "../lib/src/utils/color";
import World from "../lib/src/world";
import Entity from "../lib/src/entity";
import Box from "../lib/src/physics/box";
import Rect from "../lib/src/shapes/rect";
import Player from "../lib/src/player";
import { createVirtualJoystick } from "../lib/src/dropins/player/controls";
import { addKeyListener } from "../lib/src/keyboard";
import { isMouseDown, Mouse } from "../lib/src/mouse";
import { glMatrix, vec2 } from "gl-matrix";

// optifine like zoom
addKeyListener("KeyC", (pressed) => {
  const camera = player.getCamera();
  const canvas = Renderer.getGL().canvas;

  if (pressed) {
    camera.viewport.setWidth(canvas.width * 0.5);
    camera.viewport.setHeight(canvas.height * 0.5);
  } else {
    camera.viewport.setWidth(canvas.width);
    camera.viewport.setHeight(canvas.height);
  }
});

BLZ.setBgColor("skyblue");

const cameraViewport = vec2.fromValues(window.innerWidth, window.innerHeight);
const world = new World(vec2.fromValues(40, 40), cameraViewport);
BLZ.addSystem(world);

const player = new Player(vec2.fromValues(0, 0), vec2.fromValues(2, 3), cameraViewport);
player.zIndex = 1;
world.addEntity(player);
world.useCamera(player.getCamera());

const body = player.getPieces()[0];
body.texture = new Texture("./player.png");
console.log(body.texture);

for (let i = 0; i < 30; i++) {
  const size = vec2.fromValues(Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1);
  const test = new Entity(
    vec2.fromValues(Math.random() * 50 - 25, Math.random() * 50 - 25),
    new Box(vec2.create(), size[0], size[1]),
    [new Rect(size[0], size[1])],
    "test"
  );
  const rgba: RGBAColor = {
    r: Math.floor(Math.random() * 255),
    g: Math.floor(Math.random() * 255),
    b: Math.floor(Math.random() * 255),
  };
  test.getPieces()[0].texture = new Texture(new Color(rgba));
  world.addEntity(test);
}

if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
  // player.useTouchControls();
  createVirtualJoystick(document.body, player);
}

BLZ.toggleDebug();
BLZ.init(<HTMLCanvasElement>document.getElementById("canvas"));
BLZ.start();
