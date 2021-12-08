import { vec2 } from "gl-matrix";
import Manifold from "../manifold";
import RigidBody from "../rigidbody";

/**
 * Solves an aspect of a collision described by a {@link Manifold}.
 */
export type CollisionSolver = (
  m: Manifold,
  delta?: number,
  currIteration?: number,
  maxIterations?: number
) => void;
/**
 * Solves a property of the dynamics of a {@link RigidBody}.
 */
export type DynamicsSolver = (obj: RigidBody, delta?: number, gravity?: vec2) => void;
