import TimeStep from "./timestep";

export interface System {
  update(ts?: TimeStep): void;
}
