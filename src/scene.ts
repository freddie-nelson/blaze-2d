import { vec2 } from "gl-matrix";
import Physics from "./physics/physics";
import World from "./world";

/**
 * Represents a game scene.
 */
export default class Scene {
  /**
   * The scene's game world
   */
  world: World;

  /**
   * The scene's physics world
   */
  physics: Physics;

  /**
   * Creates a {@link Scene}.
   *
   * @param world The scene's game world
   * @param physics The scene's physics world
   */
  constructor(world = new World(vec2.fromValues(40, 40)), physics = new Physics()) {
    this.world = world;
    this.physics = physics;
  }
}
