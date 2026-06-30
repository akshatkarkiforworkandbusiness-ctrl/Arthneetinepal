import { useRef } from 'react';
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
          <meshStandardMaterial color="#00f59b" emissive="#00875a" emissiveIntensity={0.5} wireframe opacity={0.5} transparent />
        </mesh>
        {/* Bar 2 */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 2, 0.6]} />
          <meshStandardMaterial color="#00f59b" emissive="#00875a" emissiveIntensity={0.8} />
        </mesh>
        {/* Bar 3 */}
        <mesh position={[1, 0.5, 0]}>
          <boxGeometry args={[0.6, 3, 0.6]} />
          <meshStandardMaterial color="#00f59b" emissive="#00875a" emissiveIntensity={0.5} wireframe opacity={0.5} transparent />
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

// --- What We Need Visual (Network Nodes) ---
function NetworkNode() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * -0.2;
      groupRef.current.rotation.x = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={1.5}>
      <group ref={groupRef}>
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[-1, -0.5, 0.5]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.5} wireframe transparent opacity={0.4} />
        </mesh>
        <mesh position={[1, -0.5, -0.5]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.5} wireframe transparent opacity={0.4} />
        </mesh>
        
        {/* Connecting Lines */}
        <mesh position={[-0.5, 0.25, 0.25]} rotation={[0, -0.5, 1]}>
          <cylinderGeometry args={[0.02, 0.02, 1.5]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
        <mesh position={[0.5, 0.25, -0.25]} rotation={[0, 0.5, -1]}>
          <cylinderGeometry args={[0.02, 0.02, 1.5]} />
          <meshStandardMaterial color="#3b82f6" />
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
