import { glMatrix, mat4, vec3 } from "gl-matrix";
import Frustum from "./frustum";
import Object3D from "./object3d";

/**
 * Represents a virtual camera in 3D space.
 */
export default class Camera extends Object3D {
  private fov: number;
  private near: number;
  private far: number;
  private aspect: number;
  private projectionMatrix = mat4.create();

  up = vec3.fromValues(0, 1, 0);
  direction = vec3.fromValues(0, 0, -1);

  lastDirection = vec3.create();
  lastPosition = vec3.create();

  frustum: Frustum;

  /**
   * Creates a {@link Camera} instance and instantiates it's {@link Frustum}.
   *
   * @param gl The webgl context to grab canvas dimensions from
   * @param fov The fov of the camera
   * @param near The near distance of the camera frustum
   * @param far The far distance of the camera's frustum
   */
  constructor(gl: WebGL2RenderingContext, fov?: number, near?: number, far?: number) {
    super();

    this.frustum = new Frustum();
    this.setProjectionMatrix(gl, fov, near, far);
    // this.frustum.update(this);
  }

  /**
   * Sets the fov of the camera.
   *
   * @param gl The webgl context to grab canvas dimensions from
   * @param fov FOV angle of the camera in degrees
   */
  setFov(gl: WebGL2RenderingContext, fov: number) {
    this.setProjectionMatrix(gl, glMatrix.toRadian(fov));
  }

  /**
   * Calculates the camera's new projection matrix from the given parameters.
   *
   * @param gl The webgl context to grab canvas dimensions from
   * @param fov The fov to use (in degrees)
   * @param near The near distance of the camera's frustum
   * @param far The far distance of the camera's frustum
   */
  setProjectionMatrix(
    gl: WebGL2RenderingContext,
    fov: number = (70 * Math.PI) / 180,
    near: number = 0.1,
    far: number = 2000
  ) {
    this.fov = fov;
    this.near = near;
    this.far = far;
    this.aspect = gl.canvas.width / gl.canvas.height;

    this.frustum.resize(this.fov, near, far, this.aspect);

    mat4.perspective(this.projectionMatrix, this.fov, this.aspect, this.near, this.far);
    this.frustum.update(this);
  }

  /**
   * Gets the camera's projection matrix.
   *
   * @returns The camera's projection matrix
   */
  getProjectionMatrix() {
    return this.projectionMatrix;
  }

  /**
   * Calculates and returns the camera's view matrix.
   *
   * **NOTE: Everytime this function is called the view matrix is recalculated.**
   *
   * @returns The camera's view matrix
   */
  getViewMatrix() {
    const vMatrix = mat4.create();
    mat4.translate(vMatrix, vMatrix, this.getPosition());

    const target = vec3.create();
    vec3.add(target, this.getPosition(), this.direction);
    mat4.targetTo(vMatrix, this.getPosition(), target, this.up);

    return mat4.invert(vMatrix, vMatrix);
  }

  /**
   * Gets the camera's projection view matrix, the product of the projection and view matrices.
   *
   * @returns The camera's projection view matrix
   */
  getProjectionViewMatrix() {
    return mat4.multiply(mat4.create(), this.projectionMatrix, this.getViewMatrix());
  }

  /**
   * Updates the camera's frustum if the camera has changed position or direction.
   */
  update() {
    // console.log(
    //   !vec3.equals(this.getPosition(), this.lastPosition) || !vec3.equals(this.direction, this.lastDirection)
    // );
    if (
      !vec3.exactEquals(this.getPosition(), this.lastPosition) ||
      !vec3.exactEquals(this.direction, this.lastDirection)
    )
      this.frustum.update(this);

    vec3.copy(this.lastDirection, this.direction);
    vec3.copy(this.lastPosition, this.getPosition());
  }
}
