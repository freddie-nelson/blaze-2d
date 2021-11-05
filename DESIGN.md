# Working Overview

## Rendering

- Blaze uses raw WebGL shaders to render everything in a scene
- A render distance must be provided that is defined as chunks from the player
  - anything outside this distance will not be rendered and old chunks/entites outside this distance will be culled
- Blaze controls all chunk rendering
- Entities can be created using Blaze's API which can be toggled for rendering
  - Entities can only be rendered as cuboids of any width, height and depth
  - Entites can be textured by with a BLZ_CubeMap
- Chunk geometry calculations are performed on a seperate worker thread

## Textures

- Blaze has 2 texture types BLZ_Tilesheet and BLZ_CubeMap
- BLZ_Tilesheet
  - Tile size must be 16x16 or 32x32
  - Must be layed out with 3 columns per rows
    - columns 1-3 represent the top, sides and bottom of a voxel respectively
    - each row will correspond to a voxel ID
    - first row correpsonds to voxel id of 1
  - used for rendering of all voxels based on their ID
- BLZ_CubeMap
  - `[IN PROGRESS]`

## Voxels

- Voxels are always 1x1x1 and axis aligned
- Voxel can range from 0 to 255
  - however 0 is always used to represent EMPTY/AIR

## Chunks

- Before generation the chunk size can be set
  - width and depth must be equal and greater than 0
  - height cannot exceed 256
- Chunks are represented in memory using flat `Uint8Array`s to allow for easy parallelization
  - each value in the array corresponds to a voxel id
  - this means you are limited to 255 different voxel types as 0 is counted as EMPTY/AIR

## Generation

- Blaze is built to handle chunking and procedural generation for you
- All generation occurs on a seperate worker thread
- A generation callback can be provided to modify chunks as they are created by Blaze
  - this callback is provided with the raw `Uint8Array` of chunk data and the chunk's x and z coordinate

## Physics/Collisions

- A physics pass will be performed every frame to apply gravity and collisions to any physics enabled entities
- Collisions are resolved using an AABB voxel collision algorithm
  - this algorithm is not the most realistic or accurate but is very efficient

## Entities

- Entites can be textured using BLZ_CubeMap textures
- Entites do not have to be axis aligned

## Player

- Blaze provides a default player controller
  - the default player bounding box is 0.8x1.8x0.8
  - Callbacks can be registered for common events such as picking voxels, collisions, etc
