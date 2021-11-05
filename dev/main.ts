import Blaze from "../lib/src/blaze";
import Tilesheet from "../lib/src/tilesheet";
import Player from "../lib/src/player";
import { createVirtualJoystick } from "../lib/src/dropins/player/controls";
import { addKeyListener } from "../lib/src/keyboard";
import { isMouseDown, Mouse } from "../lib/src/mouse";

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
