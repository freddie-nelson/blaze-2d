import Blaze from "../lib/src/blaze";
import Tilesheet from "../lib/src/tilesheet";
import { renderRect } from "../lib/src/renderer";
import Rect from "../lib/src/shapes/rect";
import Player from "../lib/src/player";
import { createVirtualJoystick } from "../lib/src/dropins/player/controls";
import { addKeyListener } from "../lib/src/keyboard";
import { isMouseDown, Mouse } from "../lib/src/mouse";
import { glMatrix, vec2 } from "gl-matrix";

const blz = new Blaze(<HTMLCanvasElement>document.getElementById("canvas"));

const player = blz.setPlayer(new Player(blz.gl));

if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
  // player.useTouchControls();
  createVirtualJoystick(document.body, player);
}

// optifine like zoom
addKeyListener("KeyC", (pressed) => {
  const camera = player.getCamera();

  if (pressed) {
    camera.viewport.setWidth(blz.gl.canvas.width * 0.5);
    camera.viewport.setHeight(blz.gl.canvas.height * 0.5);
  } else {
    camera.viewport.setWidth(blz.gl.canvas.width);
    camera.viewport.setHeight(blz.gl.canvas.height);
  }
});

blz.setBgColor("skyblue");

blz.toggleDebug();
blz.start();

const rect = new Rect(0.5, 0.8, vec2.fromValues(-0.25, -0.4), glMatrix.toRadian(0));
blz.addSystem({
  update() {
    renderRect(blz.gl, rect);
  },
});
