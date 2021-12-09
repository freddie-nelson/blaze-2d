import Manifold from "../../manifold";

export default function preStepImpulse(m: Manifold, delta: number) {
  m.preStepImpulse(delta);
}
