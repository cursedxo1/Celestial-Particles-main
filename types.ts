
export type CelestialMode = 'vortex' | 'expand' | 'collapse' | 'drift' | 'chaotic' | 'supernova' | 'binary-star' | 'nebula' | 'solar-system';

export interface UniverseState {
  mode: CelestialMode;
  color: string;
  intensity: number;
  particleSize: number;
  speed: number;
}

export interface CelestialCommand {
  mode?: CelestialMode;
  color?: string;
  intensity?: number;
  particleSize?: number;
  speed?: number;
}
