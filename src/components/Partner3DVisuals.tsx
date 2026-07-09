import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

// --- What We Provide Visual (Bar Chart) ---
function BarChart() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={groupRef}>
        {/* Bar 1 */}
        <mesh position={[-1, -0.5, 0]}>
          <boxGeometry args={[0.6, 1, 0.6]} />
          <meshStandardMaterial color="#059669" emissive="#047857" emissiveIntensity={0.5} wireframe opacity={0.5} transparent />
        </mesh>
        {/* Bar 2 */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 2, 0.6]} />
          <meshStandardMaterial color="#059669" emissive="#047857" emissiveIntensity={0.8} />
        </mesh>
        {/* Bar 3 */}
        <mesh position={[1, 0.5, 0]}>
          <boxGeometry args={[0.6, 3, 0.6]} />
          <meshStandardMaterial color="#059669" emissive="#047857" emissiveIntensity={0.5} wireframe opacity={0.5} transparent />
        </mesh>
      </group>
    </Float>
  );
}

export function ProvideVisual() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-30 group-hover:opacity-80 transition-opacity duration-700">
      <Canvas camera={{ position: [0, 2, 8], fov: 40 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <Environment preset="city" />
        <BarChart />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-raised via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-raised via-transparent to-transparent" />
    </div>
  );
}

// --- What We Need Visual (Seal / Verification Network) ---
function NetworkNode() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * -0.2;
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.1;
    }
  });

  // Concentric notched rings — seal/verification motif
  const rings = useMemo(() => [
    { r: 0.6, segments: 24, gap: 4, speed: 0.3 },
    { r: 0.45, segments: 18, gap: 3, speed: -0.4 },
    { r: 0.3, segments: 12, gap: 3, speed: 0.5 },
  ], []);

  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={1.5}>
      <group ref={groupRef}>
        {/* Central seal disc */}
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.08, 24]} />
          <meshStandardMaterial color="#00875a" emissive="#00875a" emissiveIntensity={0.8} roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Orbiting seal nodes — smaller medallions */}
        {[[-1, 0.5, 0.5], [1, 0.5, -0.5]].map((pos, i) => (
          <group key={i} position={pos as [number, number, number]}>
            <mesh>
              <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
              <meshStandardMaterial color="#00875a" emissive="#00875a" emissiveIntensity={0.5} wireframe transparent opacity={0.5} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.25, 0.015, 6, 16]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.25} />
            </mesh>
          </group>
        ))}
        
        {/* Connecting lines — certification links */}
        <mesh position={[-0.5, 0.75, 0.25]} rotation={[0, -0.5, 1]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          <meshStandardMaterial color="#00875a" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0.5, 0.75, -0.25]} rotation={[0, 0.5, -1]}>
          <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          <meshStandardMaterial color="#00875a" transparent opacity={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

export function NeedVisual() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-30 group-hover:opacity-80 transition-opacity duration-700">
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <Environment preset="city" />
        <NetworkNode />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-l from-slate-raised via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-raised via-transparent to-transparent" />
    </div>
  );
}
