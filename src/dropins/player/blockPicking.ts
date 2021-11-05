import Blaze from "../../blaze";
import { BlockIntersection } from "../../player";
import { from3Dto1D } from "../../utils/arrays";
import { VoxelLocation } from "../../voxel";

export interface BuildAndBreakOptions {
  buildDelay: number;
  breakDelay: number;

  canBreak: () => boolean;
  canBuild: () => boolean;

  onBreak?: (i?: number, chunk?: Uint8Array, loc?: VoxelLocation) => void;
  onBuild?: (i?: number, chunk?: Uint8Array, loc?: VoxelLocation) => void;
}

/**
 * Creates a block picking handler which has allows for building and breaking blocks.
 *
 * Useful for a minecraft like game.
 *
 * @param blz The {@link Blaze} instance the handler will be used in
 * @param opts The build and break options to use
 * @returns A block picking handler
 */
export function createBuildAndBreakHandler(blz: Blaze, opts: BuildAndBreakOptions) {
  let lastBuildTime = performance.now();
  let lastBreakTime = performance.now();

  return (intersections: BlockIntersection[]) => {
    const chunkController = blz.getChunkController();
    if (!chunkController) return;

    const chunks = chunkController.getChunks();
    const size = chunkController.getSize();
    const height = chunkController.getHeight();

    // filter out undesired voxels
    const filteredIntersections = intersections.filter((i) => {
      const chunk = chunks[chunkController.chunkKey(i.location.chunk.x, i.location.chunk.y)];
      if (chunk) {
        const index = from3Dto1D(i.location.x, i.location.y, i.location.z, size, height);

        return chunk[index] > 0;
      }

      return false;
    });
    if (filteredIntersections.length === 0) return;

    const firstIntersection = filteredIntersections[0];
    const loc = firstIntersection.location;

    if (opts.canBreak() && performance.now() - lastBreakTime >= opts.breakDelay) {
      lastBreakTime = performance.now();

      // find chunk which contains the voxel
      const chunk = chunks[chunkController.chunkKey(loc.chunk.x, loc.chunk.y)];
      if (!chunk) return;

      // replace voxel with air
      const i = from3Dto1D(loc.x, loc.y, loc.z, size, height);
      if (opts.onBreak) {
        opts.onBreak(i, chunk, loc);

        if (loc.x === 0 || loc.x === size - 1 || loc.z === 0 || loc.z === size - 1) {
          chunkController.refreshChunk(loc.chunk, true);
        } else {
          chunkController.refreshChunk(loc.chunk);
        }
      }
    } else if (opts.canBuild() && performance.now() - lastBuildTime >= opts.buildDelay) {
      lastBuildTime = performance.now();

      // find voxel to build in
      const voxel = {
        chunk: loc.chunk,
        x: loc.x + firstIntersection.face[0],
        y: loc.y + firstIntersection.face[1],
        z: loc.z + firstIntersection.face[2],
      };

      let refreshNeighbours = false;

      // calculate build voxel's chunk if it exceeds chunk limits
      if (voxel.x < 0) {
        voxel.x = size - 1;
        voxel.chunk.x--;
        refreshNeighbours = true;
      } else if (voxel.x >= size) {
        voxel.x = 0;
        voxel.chunk.x++;
        refreshNeighbours = true;
      } else if (voxel.z < 0) {
        voxel.z = size - 1;
        voxel.chunk.y--;
        refreshNeighbours = true;
      } else if (voxel.z >= size) {
        voxel.z = 0;
        voxel.chunk.y++;
        refreshNeighbours = true;
      }

      const chunk = chunks[chunkController.chunkKey(voxel.chunk.x, voxel.chunk.y)];
      if (!chunk) return;

      const i = from3Dto1D(voxel.x, voxel.y, voxel.z, size, height);
      if (opts.onBuild) {
        opts.onBuild(i, chunk, voxel);

        // refresh geometry
        chunkController.refreshChunk(voxel.chunk, refreshNeighbours);
      }
    }
  };
}
