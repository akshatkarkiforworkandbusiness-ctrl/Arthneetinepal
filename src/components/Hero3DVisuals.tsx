import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// 1. Candlestick Skyline — NEPSE market data as terrain (not literal Himalaya)
function CandlestickSkyline() {
  const groupRef = useRef<THREE.Group>(null);

  // Simulated NEPSE-style candlestick data — each candle is a building/peak
  const candles = useMemo(() => [
    { x: -4.5, body: 2.2, wick: 3.2, green: true },
    { x: -3.5, body: 3.0, wick: 4.0, green: true },
    { x: -2.5, body: 1.5, wick: 2.5, green: false },
    { x: -1.5, body: 3.5, wick: 4.5, green: true },
    { x: -0.5, body: 2.0, wick: 3.0, green: false },
    { x: 0.5, body: 4.0, wick: 5.0, green: true },
    { x: 1.5, body: 2.5, wick: 3.5, green: true },
    { x: 2.5, body: 1.8, wick: 2.8, green: false },
    { x: 3.5, body: 3.2, wick: 4.2, green: true },
    { x: 4.5, body: 2.8, wick: 3.8, green: true },
  ], []);

  useFrame((state) => {
    if (groupRef.current) {
      const targetX = (state.pointer.x * 2);
      const targetY = (state.pointer.y * 1);
      groupRef.current.rotation.y += (targetX * 0.06 - groupRef.current.rotation.y) * 0.03;
      groupRef.current.rotation.x += (-targetY * 0.04 - groupRef.current.rotation.x) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.5, -4]}>
      {candles.map((c, i) => (
        <group key={i} position={[c.x, 0, 0]}>
          {/* Wick — thin vertical line */}
          <mesh position={[0, c.wick / 2 - 0.5, 0]}>
            <boxGeometry args={[0.08, c.wick, 0.08]} />
            <meshStandardMaterial
              color={c.green ? '#10b981' : '#ef4444'}
              transparent
              opacity={0.5}
            />
          </mesh>
          {/* Body — solid block */}
          <mesh position={[0, c.green ? 0.3 : -0.3, 0]}>
            <boxGeometry args={[0.6, c.body, 0.6]} />
            <meshStandardMaterial
              color={c.green ? '#059669' : '#dc2626'}
              emissive={c.green ? '#059669' : '#dc2626'}
              emissiveIntensity={0.6}
              transparent
              opacity={0.75}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
          {/* Wireframe outline */}
          <mesh position={[0, c.green ? 0.3 : -0.3, 0]}>
            <boxGeometry args={[0.62, c.body + 0.04, 0.62]} />
            <meshStandardMaterial
              color={c.green ? '#10b981' : '#ef4444'}
              wireframe
              transparent
              opacity={0.25}
            />
          </mesh>
        </group>
      ))}
      {/* Ground plane — base platform */}
      <mesh position={[0, -0.8, 0]}>
        <boxGeometry args={[12, 0.06, 3]} />
        <meshStandardMaterial color="#059669" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// 2. Economic Constellation (Data Nodes) — Medallion / seal motifs
function DataNodes() {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useMemo(() => {
    return Array.from({ length: 12 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 8 + 4,
        (Math.random() - 0.5) * 12 - 6,
      ] as [number, number, number],
      scale: Math.random() * 0.5 + 0.3,
      speed: Math.random() * 2 + 1,
      ringCount: Math.floor(Math.random() * 2) + 1,
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.04;
      const targetX = (state.pointer.x * 1);
      const targetY = (state.pointer.y * 0.5);
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.015;
      groupRef.current.position.y += (-targetY - groupRef.current.position.y) * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <Float key={i} speed={node.speed} rotationIntensity={2} floatIntensity={3}>
          <group position={node.position} scale={node.scale}>
            {/* Medallion disc */}
            <mesh>
              <cylinderGeometry args={[1, 1, 0.15, 24]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? '#059669' : '#047857'}
                emissive={i % 3 === 0 ? '#059669' : '#047857'}
                emissiveIntensity={1.0}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
            {/* Rim ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.02, 0.05, 6, 24]} />
              <meshStandardMaterial
                color="#ffffff"
                transparent
                opacity={0.45}
                emissive={i % 3 === 0 ? '#059669' : '#047857'}
                emissiveIntensity={0.4}
              />
            </mesh>
            {/* Optional inner ring */}
            {node.ringCount > 1 && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.65, 0.03, 6, 20]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.25} emissive="#10b981" emissiveIntensity={0.3} />
              </mesh>
            )}
          </group>
        </Float>
      ))}

      {/* Floating dust/particles — data flow */}
      <Sparkles count={120} scale={20} size={2.5} speed={0.3} opacity={0.4} color="#059669" />
    </group>
  );
}

export default function Hero3DVisuals() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 5, -5]} intensity={2} color="#5DCAA5" />
        <pointLight position={[-10, 10, 10]} intensity={1} color="#059669" />
        
        <Environment preset="city" />
        
        <CandlestickSkyline />
        <DataNodes />
      </Canvas>
      
      {/* Gradient overlays — minimal, just enough to keep text readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
