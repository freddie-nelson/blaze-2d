import { vec2 } from "gl-matrix";
import Blaze from "../../blaze";
import BatchRenderer from "../../renderer/batchRenderer";
import Renderer from "../../renderer/renderer";
import BlazeDropdown from "../../ui/dropdown";
import BlazeHeading from "../../ui/heading";
import BlazeInput from "../../ui/input";
import BlazeStat from "../../ui/stat";
import { TextStyle } from "../../ui/text";
import EditorPane from "./pane";

export default class PhysicsPane extends EditorPane {
  // headings
  physicsHeading = new BlazeHeading("Physics", 1, 1.5);
  dynamicsHeading = new BlazeHeading("Dynamics Space", 1, 1.5);
  collisionsHeading = new BlazeHeading("Collisions Space", 1, 1.5);

  // inputs
  debug = new BlazeDropdown("false", ["true", "false"], 1);
  velocityIterations = new BlazeInput("velocityIters", "Enter a positive number...", 1);
  positionIterations = new BlazeInput("positionIters", "Enter a positive number...", 1);
  gravityX = new BlazeInput("gravityX", "Enter a number...", 1);
  gravityY = new BlazeInput("gravityY", "Enter a number...", 1);

  // stats
  fps = new BlazeStat("FPS", 0, 1, false, TextStyle.HIGHLIGHT);
  physicsTime = new BlazeStat("Physics Time", 0, 1, false, TextStyle.HIGHLIGHT);

  dynamicsTime = new BlazeStat("Dynamics Time", 0, 1, false, TextStyle.HIGHLIGHT);
  dynamicsBodies = new BlazeStat("Bodies", 0, 1, false, TextStyle.SECONDARY);

  broadphaseTime = new BlazeStat("Broadphase Time", 0, 1, false, TextStyle.HIGHLIGHT);
  narrowphaseTime = new BlazeStat("Narrowphase Time", 0, 1, false, TextStyle.HIGHLIGHT);
  solveTime = new BlazeStat("Solving Time", 0, 1, false, TextStyle.HIGHLIGHT);
  constraintTime = new BlazeStat("Constraint Time", 0, 1, false, TextStyle.HIGHLIGHT);
  fluidTime = new BlazeStat("Fluid Time", 0, 1, false, TextStyle.HIGHLIGHT);

  collisionBodies = new BlazeStat("Bodies", 0, 1, false, TextStyle.SECONDARY);
  aabbTreeHeight = new BlazeStat("AABB Tree Height", 0, 1, false, TextStyle.SECONDARY);
  aabbLeftHeight = new BlazeStat("AABB Left Height", 0, 1, false, TextStyle.SECONDARY);
  aabbRightHeight = new BlazeStat("AABB Right Height", 0, 1, false, TextStyle.SECONDARY);
  aabbTreeInsertions = new BlazeStat("AABB Insertions", 0, 1, false, TextStyle.SECONDARY);
  collisionPairs = new BlazeStat("Collision Pairs", 0, 1, false, TextStyle.SECONDARY);
  actualCollisions = new BlazeStat("Actual Collisions", 0, 1, false, TextStyle.SECONDARY);

  /**
   * Creates a {@link PhysicsPane}.
   *
   * @param pos The top left corner of the pane in the editor grid
   * @param width The width of the pane in columns
   * @param height The height of the pane in rows
   */
  constructor(pos?: vec2, width?: number, height?: number) {
    super("physics", pos, width, height);

    const physics = Blaze.getScene().physics;

    this.element.style.padding = "0.8rem";

    this.debug.addLabel("Debug:");
    this.debug.setSelected(String(physics.debug));
    this.debug.onSelect = (selected) => {
      physics.debug = selected === "true" ? true : false;
    };

    this.velocityIterations.addLabel("Velocity Iterations:");
    this.velocityIterations.setValue(String(physics.CONFIG.VELOCITY_ITERATIONS));
    this.velocityIterations.onInput = (value) => {
      const num = Number(value);
      if (!isNaN(num) && num > 0) physics.CONFIG.VELOCITY_ITERATIONS = num;
    };

    this.positionIterations.addLabel("Position Iterations:");
    this.positionIterations.setValue(String(physics.CONFIG.POSITION_ITERATIONS));
    this.positionIterations.onInput = (value) => {
      const num = Number(value);
      if (!isNaN(num) && num > 0) physics.CONFIG.POSITION_ITERATIONS = num;
    };

    this.gravityX.addLabel("X Gravity:");
    this.gravityX.setValue(String(physics.getGravity()[0]));
    this.gravityX.onInput = (value) => {
      const num = Number(value);
      const gravity = physics.getGravity();
      if (!isNaN(num)) physics.setGravity(vec2.fromValues(num, gravity[1]));
    };

    this.gravityY.addLabel("Y Gravity:");
    this.gravityY.setValue(String(physics.getGravity()[1]));
    this.gravityY.onInput = (value) => {
      const num = Number(value);
      const gravity = physics.getGravity();
      if (!isNaN(num)) physics.setGravity(vec2.fromValues(gravity[0], num));
    };

    this.element.appendChild(this.physicsHeading.element);

    this.element.appendChild(this.fps.element);
    this.element.appendChild(this.physicsTime.element);

    this.element.appendChild(this.debug.element);
    this.element.appendChild(this.velocityIterations.element);
    this.element.appendChild(this.positionIterations.element);
    this.element.appendChild(this.gravityX.element);
    this.element.appendChild(this.gravityY.element);

    this.dynamicsHeading.element.style.marginTop = "1.6ch";
    this.collisionsHeading.element.style.marginTop = "1.6ch";

    this.element.appendChild(this.dynamicsHeading.element);
    this.element.appendChild(this.dynamicsTime.element);
    this.element.appendChild(this.dynamicsBodies.element);

    this.element.appendChild(this.collisionsHeading.element);

    this.element.appendChild(this.broadphaseTime.element);
    this.element.appendChild(this.narrowphaseTime.element);
    this.element.appendChild(this.solveTime.element);
    this.element.appendChild(this.constraintTime.element);
    this.element.appendChild(this.fluidTime.element);

    this.element.appendChild(this.collisionBodies.element);
    this.element.appendChild(this.aabbTreeHeight.element);
    this.element.appendChild(this.aabbLeftHeight.element);
    this.element.appendChild(this.aabbRightHeight.element);
    this.element.appendChild(this.aabbTreeInsertions.element);
    this.element.appendChild(this.collisionPairs.element);
    this.element.appendChild(this.actualCollisions.element);
  }

  /**
   * Update render stats.
   */
  update() {
    const physics = Blaze.getScene().physics;

    this.fps.setValue(Number((1 / Blaze.getDelta()).toFixed(1)));
    this.physicsTime.setValue(Number(physics.physicsTime.toFixed(2)));

    this.dynamicsTime.setValue(Number(physics.dynamicsTime.toFixed(2)));
    this.dynamicsBodies.setValue(physics.dynamicsSpace.objects.length);

    this.broadphaseTime.setValue(Number(physics.broadphaseTime.toFixed(2)));
    this.narrowphaseTime.setValue(Number(physics.narrowphaseTime.toFixed(2)));
    this.solveTime.setValue(Number(physics.collisionSolveTime.toFixed(2)));
    this.constraintTime.setValue(Number(physics.constraintTime.toFixed(2)));
    this.fluidTime.setValue(Number(physics.fluidTime.toFixed(2)));

    this.collisionBodies.setValue(physics.collisionsSpace.objects.length);

    this.aabbTreeHeight.setValue(physics.collisionsSpace.aabbTree.getHeight());
    this.aabbLeftHeight.setValue(
      physics.collisionsSpace.aabbTree.getHeight(physics.collisionsSpace.aabbTree.root?.left),
    );
    this.aabbRightHeight.setValue(
      physics.collisionsSpace.aabbTree.getHeight(physics.collisionsSpace.aabbTree.root?.right),
    );

    this.aabbTreeInsertions.setValue(physics.collisionsSpace.aabbTree.insertionsLastUpdate);

    this.collisionPairs.setValue(physics.collisionsSpace.collisionPairs.length);
    this.actualCollisions.setValue(
      physics.collisionsSpace.collisionManifolds.length + physics.collisionsSpace.triggerManifolds.length,
    );
  }
}
