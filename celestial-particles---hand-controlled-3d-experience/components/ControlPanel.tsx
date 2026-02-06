
import React from 'react';
import { UniverseState, CelestialCommand, CelestialMode } from '../types';
import { SlidersHorizontal, Palette } from 'lucide-react';

interface ControlPanelProps {
  universe: UniverseState;
  onUpdate: (cmd: CelestialCommand) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ universe, onUpdate }) => {
  const modes: CelestialMode[] = [
    'vortex', 'binary-star', 'nebula', 'solar-system',
    'expand', 'collapse', 'drift', 
    'chaotic', 'supernova'
  ];
  const colors = ['#4fc3f7', '#ff5252', '#7e57c2', '#66bb6a', '#ffa726', '#ffffff', '#ff00ff'];

  return (
    <div className="pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 w-72 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-right-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <SlidersHorizontal size={16} className="text-blue-400" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Manual Overrides</h2>
      </div>

      <div className="space-y-3">
        {/* Mode Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">Dynamics Mode</label>
          <div className="grid grid-cols-2 gap-1">
            {modes.map(m => (
              <button
                key={m}
                onClick={() => onUpdate({ mode: m })}
                className={`text-[9px] py-1.5 rounded-md border transition-all ${
                  universe.mode === m 
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                {m.toUpperCase().replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">Luminance Hue</label>
            <Palette size={12} className="text-gray-600" />
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => onUpdate({ color: c })}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${
                  universe.color === c ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-widest">
              <span>Orbital Distance / Gravity</span>
              <span className="text-blue-400">{(universe.intensity * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" min="0.1" max="3" step="0.1" 
              value={universe.intensity}
              onChange={(e) => onUpdate({ intensity: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-widest">
              <span>Celestial Velocity</span>
              <span className="text-blue-400">{(universe.speed * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" min="0.1" max="2" step="0.05" 
              value={universe.speed}
              onChange={(e) => onUpdate({ speed: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] text-blue-300 leading-tight italic">
        Celestial Sync: In 'Solar System' mode, push your hand toward the camera to expand the orbits.
      </div>
    </div>
  );
};
