import Manifold from "../../manifold";

export default function preStep(m: Manifold, delta: number) {
  m.preStep(delta);
}
