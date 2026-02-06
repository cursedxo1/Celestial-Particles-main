
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Stars, Environment, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { UniverseState } from '../types';

// Workaround for JSX intrinsic elements to avoid type errors
const ThreePoints = 'points' as any;
const ThreeBufferGeometry = 'bufferGeometry' as any;
const ThreeBufferAttribute = 'bufferAttribute' as any;
const ThreeColor = 'color' as any;
const ThreeFog = 'fog' as any;
const ThreeAmbientLight = 'ambientLight' as any;
const ThreeMesh = 'mesh' as any;
const ThreePlaneGeometry = 'planeGeometry' as any;
const ThreeMeshBasicMaterial = 'meshBasicMaterial' as any;

const ParticleField: React.FC<{ universe: UniverseState }> = ({ universe }) => {
  const count = 40000;
  const meshRef = useRef<THREE.Points>(null);
  
  const [positions, initialPositions, particleSeeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initPos = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 6;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;

      seeds[i] = Math.random();
    }
    return [pos, initPos, seeds];
  }, []);

  // Pre-calculate planetary metadata for Solar System mode
  const planets = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      distance: (i + 1) * 1.5,
      speed: 1 / (i + 1),
      size: 0.1 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positionsAttr = meshRef.current.geometry.attributes.position;
    const { mode, speed, intensity } = universe;
    
    // Binary star centers
    const b1 = new THREE.Vector3(Math.cos(time * speed) * 3, 0, Math.sin(time * speed) * 3);
    const b2 = new THREE.Vector3(-Math.cos(time * speed) * 3, 0, -Math.sin(time * speed) * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positionsAttr.array[i3];
      const y = positionsAttr.array[i3 + 1];
      const z = positionsAttr.array[i3 + 2];
      const dist = Math.sqrt(x*x + y*y + z*z);
      const seed = particleSeeds[i];
      
      if (mode === 'solar-system') {
        if (seed < 0.3) {
          // Central Star (Sun) - Dense core with jitter
          const r = 0.8 * intensity;
          const targetX = (Math.random() - 0.5) * r;
          const targetY = (Math.random() - 0.5) * r;
          const targetZ = (Math.random() - 0.5) * r;
          positionsAttr.array[i3] = THREE.MathUtils.lerp(x, targetX, 0.1);
          positionsAttr.array[i3 + 1] = THREE.MathUtils.lerp(y, targetY, 0.1);
          positionsAttr.array[i3 + 2] = THREE.MathUtils.lerp(z, targetZ, 0.1);
        } else {
          // Planets
          const planetIdx = Math.floor((seed - 0.3) / 0.7 * planets.length);
          const p = planets[planetIdx];
          const orbitRadius = p.distance * intensity;
          const orbitSpeed = p.speed * speed * 2;
          const angle = time * orbitSpeed + p.offset;
          
          const tx = Math.cos(angle) * orbitRadius;
          const ty = Math.sin(time * 0.1 + p.offset) * 0.2; // Slight vertical wobble
          const tz = Math.sin(angle) * orbitRadius;
          
          // Particles orbit the planet center
          const jitter = 0.15;
          const jx = (Math.random() - 0.5) * jitter;
          const jy = (Math.random() - 0.5) * jitter;
          const jz = (Math.random() - 0.5) * jitter;

          positionsAttr.array[i3] = THREE.MathUtils.lerp(x, tx + jx, 0.05);
          positionsAttr.array[i3 + 1] = THREE.MathUtils.lerp(y, ty + jy, 0.05);
          positionsAttr.array[i3 + 2] = THREE.MathUtils.lerp(z, tz + jz, 0.05);
        }
      } else if (mode === 'binary-star') {
        const target = seed > 0.5 ? b1 : b2;
        const dx = target.x - x;
        const dy = target.y - y;
        const dz = target.z - z;
        const dTarget = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.1;
        positionsAttr.array[i3] += (dx / dTarget) * 0.05 * speed + (z - target.z) * 0.01 * speed;
        positionsAttr.array[i3 + 1] += (dy / dTarget) * 0.05 * speed;
        positionsAttr.array[i3 + 2] += (dz / dTarget) * 0.05 * speed - (x - target.x) * 0.01 * speed;
      } else if (mode === 'nebula') {
        const s = seed * 10;
        positionsAttr.array[i3] += Math.sin(time * 0.2 + s) * 0.005 * intensity;
        positionsAttr.array[i3 + 1] += Math.cos(time * 0.3 + s) * 0.005 * intensity;
        positionsAttr.array[i3 + 2] += Math.sin(time * 0.15 + s) * 0.005 * intensity;
        positionsAttr.array[i3] *= 0.9995;
        positionsAttr.array[i3 + 1] *= 0.9995;
        positionsAttr.array[i3 + 2] *= 0.9995;
      } else if (mode === 'vortex') {
        const ang = 0.015 * speed * (1 / (dist + 0.2));
        const nx = x * Math.cos(ang) - z * Math.sin(ang);
        const nz = x * Math.sin(ang) + z * Math.cos(ang);
        positionsAttr.array[i3] = nx;
        positionsAttr.array[i3 + 2] = nz;
        positionsAttr.array[i3] *= 0.998;
        positionsAttr.array[i3 + 1] *= 0.998;
        positionsAttr.array[i3 + 2] *= 0.998;
      } else if (mode === 'expand') {
        const factor = 1 + (0.008 * speed * intensity);
        positionsAttr.array[i3] *= factor;
        positionsAttr.array[i3 + 1] *= factor;
        positionsAttr.array[i3 + 2] *= factor;
        if (dist > 18) {
            positionsAttr.array[i3] = (Math.random() - 0.5) * 4;
            positionsAttr.array[i3+1] = (Math.random() - 0.5) * 4;
            positionsAttr.array[i3+2] = (Math.random() - 0.5) * 4;
        }
      } else if (mode === 'collapse') {
        const factor = 1 - (0.015 * speed * intensity);
        positionsAttr.array[i3] *= factor;
        positionsAttr.array[i3 + 1] *= factor;
        positionsAttr.array[i3 + 2] *= factor;
        if (dist < 0.2) {
            positionsAttr.array[i3] = (Math.random() - 0.5) * 12;
            positionsAttr.array[i3+1] = (Math.random() - 0.5) * 12;
            positionsAttr.array[i3+2] = (Math.random() - 0.5) * 12;
        }
      } else if (mode === 'supernova') {
         const force = (Math.sin(time * 4) + 1.2) * 0.08 * intensity;
         positionsAttr.array[i3] += (x/dist) * force;
         positionsAttr.array[i3 + 1] += (y/dist) * force;
         positionsAttr.array[i3 + 2] += (z/dist) * force;
         if (dist > 25) {
            positionsAttr.array[i3] = initialPositions[i3] * 0.15;
            positionsAttr.array[i3 + 1] = initialPositions[i3+1] * 0.15;
            positionsAttr.array[i3 + 2] = initialPositions[i3+2] * 0.15;
         }
      } else if (mode === 'chaotic') {
        positionsAttr.array[i3] += (Math.random() - 0.5) * 0.2 * speed;
        positionsAttr.array[i3 + 1] += (Math.random() - 0.5) * 0.2 * speed;
        positionsAttr.array[i3 + 2] += (Math.random() - 0.5) * 0.2 * speed;
      } else {
        positionsAttr.array[i3] += Math.sin(time + i) * 0.003;
        positionsAttr.array[i3+1] += Math.cos(time + i) * 0.003;
      }
    }
    
    positionsAttr.needsUpdate = true;
  });

  return (
    <ThreePoints ref={meshRef}>
      <ThreeBufferGeometry>
        <ThreeBufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </ThreeBufferGeometry>
      <PointMaterial
        transparent
        color={universe.color}
        size={universe.particleSize}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </ThreePoints>
  );
};

export const CelestialCanvas: React.FC<{ universe: UniverseState }> = ({ universe }) => {
  return (
    <div className="absolute inset-0 bg-[#02040a]">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ThreeColor attach="background" args={['#020308']} />
        <ThreeFog attach="fog" args={['#020308', 8, 35]} />
        <ThreeAmbientLight intensity={0.3} />
        
        <Stars radius={150} depth={60} count={8000} factor={6} saturation={0.5} fade speed={1.5} />
        
        <Center>
          <ParticleField universe={universe} />
        </Center>
        
        <ThreeMesh position={[0, 0, -10]} scale={[60, 60, 1]}>
          <ThreePlaneGeometry />
          <ThreeMeshBasicMaterial 
            color={universe.color} 
            transparent 
            opacity={0.03} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </ThreeMesh>

        <Environment preset="night" />
      </Canvas>
    </div>
  );
};
