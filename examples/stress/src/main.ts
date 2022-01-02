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
import { boxGrid } from "@helpers/structures";
import createBounds from "@helpers/bounds";
import { randomTexs } from "@helpers/textures";
import { mousePicker } from "@helpers/mouse";

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
const boundsTex = new Texture(new Color("grey"));
ATLAS.addTexture(boundsTex);

const rectTexs = randomTexs(500, ATLAS);

const pickedTex = new Texture(new Color("red"));
ATLAS.addTexture(pickedTex, true);

// create demo scene
const thickness = 2;
const BOUNDS = createBounds(thickness, boundsTex);

// add rects
const size = 1;
const spacing = size / 20;
const cols = Math.min(27, Math.floor(BOUNDS.width / size - thickness) - 1);
const rows = 12;

const boxes = boxGrid(rectTexs, size, size, rows, cols, spacing, 0, BOUNDS.min[1] + thickness / 2);

const bodyCount = new BlazeStat("Bodies", boxes.length, 2, true, TextStyle.PRIMARY);
bodyCount.element.style.position = "absolute";
bodyCount.element.style.left = ".6rem";
bodyCount.element.style.top = ".2rem";
document.body.appendChild(bodyCount.element);

// pick entity on click
mousePicker(() => undefined, "bounds");
