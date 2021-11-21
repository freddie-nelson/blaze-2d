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
import Circle from "../lib/src/shapes/circle";

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
// world.debug = true;

(async () => {
  const maxSize = 6;
  const area = 50;
  const rotationSpeed = 360 * 1;
  const count = 40;

  for (let i = 0; i < count; i++) {
    const size = vec2.fromValues(
      Math.floor(Math.random() * maxSize) + 1,
      Math.floor(Math.random() * maxSize) + 1
    );
    const test = new Entity(
      vec2.fromValues(Math.random() * area - area / 2, Math.random() * area - area / 2),
      new Box(vec2.create(), size[0], size[1]),
      // [new Rect(size[0], size[1], vec2.fromValues(0, 0))],
      [new Rect(size[0], size[1], vec2.fromValues(0, 0))],
      "test"
    );
    const rgba: RGBAColor = {
      r: Math.floor(Math.random() * 255),
      g: Math.floor(Math.random() * 255),
      b: Math.floor(Math.random() * 255),
    };
    test.getPieces()[0].texture = new Texture(new Color(rgba));
    // console.log(test.getPieces()[0]);

    test.setZIndex(1);

    world.addEntity(test);
    physics.addBody(test);
    atlas.addTexture(test.getPieces()[0].texture);

    const speed = Math.floor(Math.random() * rotationSpeed * 2) - rotationSpeed;
    test.addEventListener("update", () => {
      test.rotate(((speed * Math.PI) / 180) * BLZ.getDelta());
      // test.getPieces()[0].rotate(((-speed * Math.PI) / 180) * BLZ.getDelta());
    });
  }

  const size = vec2.fromValues(6, 6);
  const test = new Entity(
    vec2.fromValues(0, 0),
    new Box(vec2.create(), size[0] * 2.5, size[0] * 2.5),
    [new Circle(size[0], vec2.fromValues(size[0] * 1.2, size[0] * 1.2)), new Rect(2, 6)],
    "test"
  );
  const rgba: RGBAColor = {
    r: Math.floor(Math.random() * 255),
    g: Math.floor(Math.random() * 255),
    b: Math.floor(Math.random() * 255),
    // a: 0.2,
  };

  const circle = test.getPieces()[0];
  circle.texture = new Texture(new Color(rgba));

  const rect = test.getPieces()[1];
  rect.texture = circle.texture;
  rect.setRotation((-45 * Math.PI) / 180);
  rect.setPosition(vec2.fromValues(2, 2));

  test.setZIndex(3);
  player.setZIndex(2);

  world.addEntity(test);
  physics.addBody(test);
  atlas.addTexture(test.getPieces()[0].texture);

  const minRadius = 2;
  const maxRadius = 6;
  let step = 1;
  test.addEventListener("update", (delta: number, e: Entity) => {
    e.rotate(((120 * Math.PI) / 180) * delta);

    const circle = <Circle>e.getPieces()[0];

    const radius = circle.getRadius();
    if (radius <= minRadius || radius >= maxRadius) {
      step *= -1;
    }

    circle.setRadius(radius + step * BLZ.getDelta());

    const pos = circle.getPosition();
    vec2.scaleAndAdd(pos, pos, vec2.fromValues(step, step), BLZ.getDelta());

    e.bounds.setWidth(circle.getWidth() * 1.8);
    e.bounds.setHeight(circle.getWidth() * 1.8);
  });

  const body = player.getPieces()[0];
  body.texture = new Texture();
  await body.texture.loadImage("./player.png");
  atlas.addTexture(body.texture);

  BatchRenderer.atlas = atlas;
  await atlas.refreshAtlas();
  world.useBatchRenderer = true;
  Debug.rendererToggle.checked = true;

  addKeyListener("KeyR", (pressed) => {
    if (pressed) {
      world.getEntities().forEach((e) => {
        e.setRotation(0);
      });
    }
  });

  BLZ.addSystem({
    update(delta: number) {
      // test.getPieces()[0].rotate(((-90 * Math.PI) / 180) * delta);
    },
  });

  // console.log(atlas.getAllTextures());
  // document.body.appendChild(atlas.image);
  // console.log(atlas.imagePath);

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
