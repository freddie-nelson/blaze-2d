import { vec3 } from "gl-matrix";
import ChunkController from "../../chunk/controller";
import { getVoxel, VoxelLocation } from "../../voxel";
import Box from "../box";

/**
 * Raycaster which can efficiently calculate intersections with chunks in a {@link ChunkController} and Entities.
 */
export default class Raycaster {
  private origin: vec3;
  private direction: vec3;
  private length: number;
  private end: vec3;

  /**
   * Creates a ray from a origin, direction and a length.
   *
   * @param origin The starting position of the ray
   * @param direction The direction of the ray. Must be normalized.
   * @param length The length of the ray.
   */
  constructor(origin: vec3, direction: vec3, length: number) {
    this.set(origin, direction, length);
  }

  /**
   * Sets the origin, direction and length of the ray.
   *
   * @param origin The starting position of the ray
   * @param direction The direction of the ray. Must be normalized.
   * @param length The length of the ray.
   */
  set(origin: vec3, direction: vec3, length: number) {
    this.origin = origin;
    this.direction = direction;
    this.length = length;

    this.end = vec3.fromValues(direction[0], direction[1], direction[2]);
    vec3.scaleAndAdd(this.end, this.origin, this.end, this.length);
  }

  /**
   * Traverses the voxel world along the ray to calculate which voxels the ray intersects with. Each voxel is treated as a cube of size 1x1x1 by the ray.
   *
   * @param chunkController The chunk controller to pull chunk data from.
   *
   * @returns The positions of every voxel the ray intersected with **(INCLUDING START AND AIR VOXELS)** and their face normal the ray entered. Sorted in ascending order by distance from the ray's origin.
   */
  intersectChunks(chunkController: ChunkController): { location: VoxelLocation; face: vec3 }[] {
    const chunks = chunkController.getChunks();
    const intersections: { location: VoxelLocation; face: vec3 }[] = [];

    // voxel containing the origin point
    let x = Math.floor(this.origin[0]);
    let y = Math.floor(this.origin[1]);
    let z = Math.floor(this.origin[2]);

    // break out direction vector
    const dx = this.direction[0];
    const dy = this.direction[1];
    const dz = this.direction[2];

    // direction to increment x, y, z when stepping
    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);
    const stepZ = Math.sign(dz);

    // the amount we need to step along the ray to cross a voxel boundary
    let tMaxX = this.intbound(this.origin[0], dx);
    let tMaxY = this.intbound(this.origin[1], dy);
    let tMaxZ = this.intbound(this.origin[2], dz);

    // the change in t when taking a step (always positive)
    const tDeltaX = stepX / dx;
    const tDeltaY = stepY / dy;
    const tDeltaZ = stepZ / dz;

    let face = vec3.create();

    // avoid infinite loop
    if (dx === 0 && dy === 0 && dz === 0) throw new Error("Raycaster: Cannot raycast in zero direction.");

    const length = this.length;

    do {
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          tMaxX += tDeltaX;

          face = vec3.fromValues(-stepX, 0, 0);
        } else {
          z += stepZ;
          tMaxZ += tDeltaZ;

          face = vec3.fromValues(0, 0, -stepZ);
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          tMaxY += tDeltaY;

          face = vec3.fromValues(0, -stepY, 0);
        } else {
          z += stepZ;
          tMaxZ += tDeltaZ;

          face = vec3.fromValues(0, 0, -stepZ);
        }
      }

      const vox = getVoxel(
        vec3.fromValues(x, y, z),
        chunkController.getSize(),
        chunkController.getHeight(),
        chunkController.getBedrock()
      );
      if (vox && chunks[chunkController.chunkKey(vox.chunk.x, vox.chunk.y)]) {
        intersections.push({
          location: vox,
          face: vec3.fromValues(face[0], face[1], face[2]),
        });
      }
    } while (vec3.dist(this.origin, vec3.fromValues(x, y, z)) <= length);

    return intersections;
  }

  /**
   * Finds the smallest positive t such that s+t*ds is an integer
   *
   * @param s x, y or z point on ray
   * @param ds direction to step
   */
  private intbound(s: number, ds: number): number {
    if (ds < 0) {
      return this.intbound(-s, -ds);
    } else {
      s = this.mod(s, 1);
      // problem is now s+t*ds = 1
      return (1 - s) / ds;
    }
  }

  private mod(value: number, modulus: number) {
    return ((value % modulus) + modulus) % modulus;
  }

  intersectBox(box: Box) {}
}
