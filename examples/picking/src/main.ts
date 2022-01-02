import Blaze from "@blz/blaze";
import BatchRenderer from "@blz/renderer/batchRenderer";
import Texture from "@blz/texture/texture";
import TextureAtlas from "@blz/texture/atlas";
import Color from "@blz/utils/color";
import { vec2 } from "gl-matrix";
import Entity from "@blz/entity";
import { Mouse } from "@blz/input/mouse";
import RectCollider from "@blz/physics/collider/rect";
import Rect from "@blz/shapes/rect";
import MouseConstraint from "@blz/physics/constraints/mouse";
import { mousePicker } from "@helpers/mouse";
import { boxGrid } from "@helpers/structures";
import createBounds from "@helpers/bounds";

// setup engine
Blaze.init(document.querySelector("canvas"));
Blaze.setBgColor(new Color("skyblue"));
Blaze.start();

const CANVAS = Blaze.getCanvas();
const SCENE = Blaze.getScene();
const WORLD = SCENE.world;
const PHYSICS = SCENE.physics;

// MAIN
// setup atlas
const ATLAS = new TextureAtlas(1024);
BatchRenderer.atlas = ATLAS;
WORLD.useBatchRenderer = true;

// textures
const boundsTex = new Texture(new Color("grey"));
const rectTex = new Texture(new Color("blue"));
const pickedTex = new Texture(new Color("red"));

ATLAS.addTextures(boundsTex, rectTex, pickedTex);

// create demo scene
const thickness = 2;
const BOUNDS = createBounds(thickness, boundsTex);

// add rects
const boxes = boxGrid(rectTex, 1, 1, 8, 20, 0.1, 0, BOUNDS.min[1] + thickness / 2);

// pick entity on click
mousePicker((picked, pick) => {
  if (pick) {
    picked.getPieces()[0].texture = pickedTex;
  } else {
    picked.getPieces()[0].texture = rectTex;
  }
}, "bounds");
