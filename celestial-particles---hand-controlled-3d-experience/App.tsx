
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CelestialCanvas } from './components/CelestialCanvas';
import { CameraOverlay } from './components/CameraOverlay';
import { ControlPanel } from './components/ControlPanel';
import { GeminiConnector } from './components/GeminiConnector';
import { UniverseState, CelestialCommand } from './types';
import { Sparkles, Settings2, Power, Waves } from 'lucide-react';

const INITIAL_STATE: UniverseState = {
  mode: 'vortex',
  color: '#4fc3f7',
  intensity: 1.0,
  particleSize: 0.05,
  speed: 0.5,
};

const App: React.FC = () => {
  const [universe, setUniverse] = useState<UniverseState>(INITIAL_STATE);
  const [isActive, setIsActive] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  }, []);

  const updateUniverse = useCallback((cmd: CelestialCommand) => {
    setUniverse(prev => {
      const newState = { ...prev, ...cmd };
      addLog(`Universe updated: ${newState.mode} (${newState.color})`);
      return newState;
    });
  }, [addLog]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* 3D Scene */}
      <CelestialCanvas universe={universe} />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
        {/* Top Header */}
        <header className="flex justify-between items-start w-full">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white flex items-center gap-3 drop-shadow-lg">
              <Sparkles className="text-blue-400" />
              CELESTIAL PARTICLES
            </h1>
            <p className="text-sm text-gray-400 font-mono mt-1 opacity-70">
              Interactive 3D Universe Engine
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`pointer-events-auto flex items-center gap-2 px-6 py-2 rounded-full border transition-all duration-300 ${
                isActive 
                ? 'bg-red-500/20 border-red-500/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'bg-blue-500/20 border-blue-500/50 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
              }`}
            >
              <Power size={18} />
              {isActive ? 'SHUTDOWN ENGINE' : 'ACTIVATE ENGINE'}
            </button>
            
            {isActive && (
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-3 w-64 pointer-events-auto">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-2">Live Logs</h3>
                 <div className="space-y-1">
                   {logs.map((log, i) => (
                     <div key={i} className="text-[10px] font-mono text-blue-300/80 animate-in fade-in slide-in-from-left-2 truncate">
                       {`> ${log}`}
                     </div>
                   ))}
                   {logs.length === 0 && <div className="text-[10px] text-gray-600 italic">Waiting for input...</div>}
                 </div>
              </div>
            )}
          </div>
        </header>

        {/* Bottom Section */}
        <div className="flex justify-between items-end gap-6 w-full">
          <div className="flex flex-col gap-4">
             {isActive && (
               <GeminiConnector 
                onCommand={updateUniverse} 
                onStatusChange={setIsLive} 
                isActive={isActive}
               />
             )}
          </div>

          <div className="flex flex-col items-end gap-4">
            {isActive && <ControlPanel universe={universe} onUpdate={updateUniverse} />}
            <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
              Build v1.0.4 | Gemini Live Integrated
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Initial Overlay */}
      {!isActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">
          <div className="text-center space-y-8 max-w-lg p-12 rounded-3xl border border-white/5 bg-white/5 shadow-2xl">
            <div className="relative inline-block">
               <div className="absolute inset-0 blur-3xl bg-blue-500/20 rounded-full animate-pulse"></div>
               <Sparkles size={80} className="relative text-blue-400 mx-auto" />
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-thin tracking-tighter text-white">THE COSMOS AWAITS</h2>
              <p className="text-gray-400 leading-relaxed">
                Connect your camera and microphone to control a vast celestial field.
                Gemini's intelligence interprets your gestures and voice to reshape the stars.
              </p>
            </div>
            <button
              onClick={() => setIsActive(true)}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/40"
            >
              INITIALIZE SYNC
            </button>
          </div>
        </div>
      )}

      {/* Real-time Camera Feed for Gesture Tracking (small and subtle) */}
      <CameraOverlay isActive={isActive && isLive} />
    </div>
  );
};

export default App;
