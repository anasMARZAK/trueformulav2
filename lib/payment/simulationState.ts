export type SimulationMode = 'always_success' | 'force_failure';

let currentSimulationMode: SimulationMode = 'always_success';

export function getSimulationMode(): SimulationMode {
  return currentSimulationMode;
}

export function setSimulationMode(mode: SimulationMode): SimulationMode {
  currentSimulationMode = mode;
  return currentSimulationMode;
}
