
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, MicOff, Radio, AlertCircle } from 'lucide-react';
import { CelestialCommand } from '../types';

// Constants for audio encoding/decoding
const SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

interface GeminiConnectorProps {
  onCommand: (cmd: CelestialCommand) => void;
  onStatusChange: (isLive: boolean) => void;
  isActive: boolean;
}

export const GeminiConnector: React.FC<GeminiConnectorProps> = ({ onCommand, onStatusChange, isActive }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Function Declaration for Gemini Tool
  const updateUniverseFunctionDeclaration: FunctionDeclaration = {
    name: 'updateUniverse',
    parameters: {
      type: Type.OBJECT,
      description: 'Update the celestial particle system parameters based on user input or detected gestures.',
      properties: {
        mode: {
          type: Type.STRING,
          description: 'The movement mode: vortex, expand, collapse, drift, chaotic, supernova, binary-star, nebula, solar-system.',
        },
        color: {
          type: Type.STRING,
          description: 'A CSS color string for the particle light.',
        },
        intensity: {
          type: Type.NUMBER,
          description: 'Intensity of gravity or orbital distance (0.1 to 3.0).',
        },
        speed: {
          type: Type.NUMBER,
          description: 'Speed of motion/velocity (0.1 to 2.0).',
        },
      },
    },
  };

  const startSession = async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [updateUniverseFunctionDeclaration] }],
          systemInstruction: `You are the COSMOS ARCHITECT. You control a vast 3D particle universe.
          
          Your tone should be poetic and technically authoritative. 
          
          GESTURE MAPPINGS:
          - Hand flat, moving towards camera -> Switch to 'solar-system' mode, increase 'intensity' (orbital distance).
          - Hand moving away from camera -> Decrease 'intensity'.
          - Two hands forming circles -> Trigger 'binary-star' mode.
          - Hands floating slowly like clouds -> Trigger 'nebula' mode.
          - Raise two open hands -> 'supernova' mode.
          - Close fist -> 'collapse' mode or stop movement.
          - Circular motion -> 'vortex' mode.
          - Wave wildly -> 'chaotic' mode.
          
          When users mention 'solar system', align the particles into a sun and orbiting planets.
          
          Always narrate your cosmic actions briefly. 
          Example: "Assembling a planetary system around a golden star."
          
          Always use 'updateUniverse' to execute the transformation.`,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            onStatusChange(true);
            
            const source = audioContextRef.current!.createMediaStreamSource(streamRef.current!);
            processorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              setAudioLevel(Math.sqrt(sum / inputData.length));
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current!.destination);

            const video = document.createElement('video');
            video.srcObject = streamRef.current;
            video.muted = true;
            video.play();
            
            const captureInterval = setInterval(async () => {
              if (!isConnected) {
                  clearInterval(captureInterval);
                  return;
              }
              try {
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 240;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0, 320, 240);
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const base64Data = await blobToBase64(blob);
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({
                                media: { data: base64Data, mimeType: 'image/jpeg' }
                            });
                        });
                    }
                }, 'image/jpeg', 0.5);
              } catch (e) {
                console.error("Frame capture error", e);
              }
            }, 1000);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'updateUniverse') {
                  onCommand(fc.args as CelestialCommand);
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: "Universe updated" },
                      }
                    });
                  });
                }
              }
            }
            
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && outputAudioContextRef.current) {
               const ctx = outputAudioContextRef.current;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), ctx, OUTPUT_SAMPLE_RATE, 1);
               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(ctx.destination);
               source.addEventListener('ended', () => sourcesRef.current.delete(source));
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current) try { source.stop(); } catch(e) {}
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Gemini Error", e);
            setError("Connection lost to the cosmos.");
            stopSession();
          },
          onclose: () => stopSession()
        }
      });
      sessionRef.current = sessionPromise;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Celestial sync failed.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (processorRef.current) processorRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (sessionRef.current) sessionRef.current.then((s: any) => { try { s.close(); } catch(e) {} });
    setIsConnected(false);
    setIsConnecting(false);
    onStatusChange(false);
  };

  useEffect(() => { return () => stopSession(); }, []);

  function createBlob(data: Float32Array): { data: string, mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div className="pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-left-4 shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <Radio size={16} className={isConnected ? "text-red-500 animate-pulse" : "text-gray-500"} />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Neural Cosmos Sync</h3>
        </div>
        {isConnected && (
            <div className="flex items-center gap-0.5 h-3">
                {[...Array(12)].map((_, i) => (
                    <div 
                        key={i} 
                        className="w-0.5 bg-blue-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(2, audioLevel * 150 * (Math.random() * 0.5 + 0.5))}px` }}
                    />
                ))}
            </div>
        )}
      </div>

      {!isConnected ? (
        <button
          onClick={startSession}
          disabled={isConnecting}
          className={`flex items-center justify-center gap-3 w-full py-3 rounded-xl font-bold tracking-[0.2em] transition-all text-xs ${
            isConnecting 
            ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 active:scale-95'
          }`}
        >
          {isConnecting ? "ALIGNING VECTORS..." : "INITIALIZE GUIDE"}
        </button>
      ) : (
        <button
          onClick={stopSession}
          className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 transition-all font-bold tracking-widest uppercase text-[10px]"
        >
          Deactivate Architect
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 text-red-400 text-[10px] bg-red-950/20 p-2 rounded-lg border border-red-500/20">
          <AlertCircle size={14} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
