import { CollisionResult } from "../collider/collider";
import CollisionObject from "../collisionObject";
import PhysicsObject from "../object";
import { Manifold } from "../spaces/collisions";

/**
 * Solves an aspect of a collision described by a {@link Manifold}.
 */
export type CollisionSolver = (m: Manifold) => void;

/**
 * Solves a property of the dynamics of a {@link PhysicsObject}.
 */
export type DynamicsSolver = (obj: PhysicsObject) => void;
