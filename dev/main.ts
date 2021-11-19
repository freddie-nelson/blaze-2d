import BLZ from "../lib/src/blaze";
import Renderer from "../lib/src/renderer/renderer";
import Tilesheet from "../lib/src/tilesheet";
import Texture from "../lib/src/texture/texture";
import TextureAtlas from "../lib/src/texture/atlas";
import Debug from "../lib/src/debug";
import Color, { RGBAColor } from "../lib/src/utils/color";
import World from "../lib/src/world";
import Physics from "../lib/src/physics/physics";
import Entity from "../lib/src/entity";
import Box from "../lib/src/physics/box";
import Rect from "../lib/src/shapes/rect";
import Player from "../lib/src/player";
import { createVirtualJoystick } from "../lib/src/dropins/player/controls";
import { addKeyListener } from "../lib/src/keyboard";
import { isMouseDown, Mouse } from "../lib/src/mouse";
import { glMatrix, vec2 } from "gl-matrix";
import BatchRenderer from "../lib/src/renderer/batchRenderer";

BLZ.setBgColor("skyblue");

const cameraViewport = vec2.fromValues(window.innerWidth, window.innerHeight);
const world = new World(vec2.fromValues(40, 40), cameraViewport);
const physics = new Physics();

BLZ.addSystem(world);
BLZ.addSystem(physics);

const atlas = new TextureAtlas(8000);

const player = new Player(vec2.fromValues(0, 0), vec2.fromValues(2, 3), cameraViewport);
player.setZIndex(5);
world.addEntity(player);
world.useCamera(player.getCamera());
physics.addBody(player);

if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
  // player.useTouchControls();
  createVirtualJoystick(document.body, player);
}

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

addKeyListener("ArrowRight", (pressed) => {
  if (pressed) {
    player.rotate((-10 * Math.PI) / 180);
  }
});

addKeyListener("ArrowLeft", (pressed) => {
  if (pressed) {
    player.rotate((10 * Math.PI) / 180);
  }
});

window.addEventListener("resize", () => {
  Renderer.resizeToCanvas();
  const canvas = Renderer.getGL().canvas;
  world.getCamera().viewport.setWidth(canvas.width);
  world.getCamera().viewport.setHeight(canvas.height);
});

BLZ.toggleDebug();
// Debug.player = player;
Debug.world = world;
world.debug = true;

(async () => {
  // for (let i = 0; i < 10; i++) {
  //   const size = vec2.fromValues(Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 5) + 1);
  //   const test = new Entity(
  //     vec2.fromValues(Math.random() * 12 - 6, Math.random() * 12 - 6),
  //     new Box(vec2.create(), size[0], size[1]),
  //     [new Rect(size[0], size[1])],
  //     "test"
  //   );
  //   const rgba: RGBAColor = {
  //     r: Math.floor(Math.random() * 255),
  //     g: Math.floor(Math.random() * 255),
  //     b: Math.floor(Math.random() * 255),
  //   };
  //   test.getPieces()[0].texture = new Texture(new Color(rgba));

  //   test.setZIndex(Math.floor(Math.random() * 10));
  //   test.setRotation((Math.floor(Math.random() * 360) * Math.PI) / 180);

  //   world.addEntity(test);
  //   physics.addBody(test);
  //   atlas.addTexture(test.getPieces()[0].texture);
  // }

  const size = vec2.fromValues(3, 6);
  const test = new Entity(
    vec2.fromValues(0, 0),
    new Box(vec2.create(), size[0], size[1]),
    [new Rect(size[0], size[1], vec2.fromValues(-size[0] / 2, -size[1] / 2))],
    "test"
  );
  const rgba: RGBAColor = {
    r: Math.floor(Math.random() * 255),
    g: Math.floor(Math.random() * 255),
    b: Math.floor(Math.random() * 255),
  };
  test.getPieces()[0].texture = new Texture(new Color(rgba));

  test.setZIndex(0);
  // test.setRotation((45 * Math.PI) / 180);

  world.addEntity(test);
  physics.addBody(test);
  atlas.addTexture(test.getPieces()[0].texture);

  const body = player.getPieces()[0];
  body.texture = new Texture();
  await body.texture.loadImage("./player.png");
  atlas.addTexture(body.texture);

  BatchRenderer.atlas = atlas;
  await atlas.refreshAtlas();
  world.useBatchRenderer = true;

  addKeyListener("KeyR", (pressed) => {
    if (pressed) {
      world.getEntities().forEach((e) => {
        e.setRotation(0);
      });
    }
  });

  BLZ.addSystem({
    update(delta: number) {
      test.rotate(((90 * Math.PI) / 180) * delta);
      // test.getPieces()[0].rotate(((-90 * Math.PI) / 180) * delta);
    },
  });

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
