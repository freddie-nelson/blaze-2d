import BLZ from "../lib/src/blaze";
import Renderer from "../lib/src/renderer/renderer";
import Tilesheet from "../lib/src/tilesheet";
import Texture from "../lib/src/texture/texture";
import TextureAtlas from "../lib/src/texture/atlas";
import Debug from "../lib/src/debug";
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
import BatchRenderer from "../lib/src/renderer/batchRenderer";
import InstanceRenderer from "../lib/src/renderer/renderer";

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

const atlas = new TextureAtlas(8000);

const player = new Player(vec2.fromValues(0, 0), vec2.fromValues(2, 3), cameraViewport);
player.zIndex = 1;
world.addEntity(player);
world.useCamera(player.getCamera());

if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
  // player.useTouchControls();
  createVirtualJoystick(document.body, player);
}

window.addEventListener("resize", () => {
  Renderer.resizeToCanvas();
  const canvas = Renderer.getGL().canvas;
  world.getCamera().viewport.setWidth(canvas.width);
  world.getCamera().viewport.setHeight(canvas.height);
});

BLZ.toggleDebug();
Debug.player = player;
Debug.world = world;

(async () => {
  for (let i = 0; i < 250; i++) {
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
    atlas.addTexture(test.getPieces()[0].texture);
  }

  const body = player.getPieces()[0];
  body.texture = new Texture();
  await body.texture.loadImage("./player.png");
  atlas.addTexture(body.texture);

  BatchRenderer.atlas = atlas;
  await atlas.refreshAtlas();
  world.useBatchRenderer = true;

  // console.log(atlas.getAllTextures());
  // document.body.appendChild(atlas.image);

  BLZ.init(<HTMLCanvasElement>document.getElementById("canvas"));
  BLZ.start();
})();

// const atlas = new TextureAtlas(1200);
// (async () => {
//   for (let i = 0; i < 50; i++) {
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");

//     if (Math.random() < 0.9) {
//       canvas.height = Math.floor(Math.random() * 200) + 50;
//       canvas.width = Math.floor(Math.random() * 200) + 50;
//       ctx.fillStyle = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(
//         Math.random() * 255
//       )}, ${Math.floor(Math.random() * 255)})`;
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       const texture = new Texture();
//       await texture.loadImage(canvas.toDataURL());
//       atlas.addTexture(texture);
//     } else {
//       const texture = new Texture(
//         new Color({
//           r: Math.floor(Math.random() * 255),
//           g: Math.floor(Math.random() * 255),
//           b: Math.floor(Math.random() * 255),
//         })
//       );
//       atlas.addTexture(texture);
//     }
//   }

//   atlas.refreshAtlas();
//   document.body.appendChild(atlas.image);
// })();
