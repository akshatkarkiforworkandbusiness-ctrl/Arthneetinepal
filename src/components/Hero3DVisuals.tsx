import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// 1. Abstract Mountain Mesh
function Mountain() {
  const meshRef = useRef<THREE.Group>(null);

  // Parallax effect based on mouse movement
  useFrame((state) => {
    if (meshRef.current) {
      const targetX = (state.pointer.x * 2);
      const targetY = (state.pointer.y * 1);
      
      meshRef.current.rotation.y += (targetX * 0.1 - meshRef.current.rotation.y) * 0.05;
      meshRef.current.rotation.x += (-targetY * 0.1 - meshRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={[0, -6, -10]}>
      {/* Main Peak */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[0, 2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[6, 12, 4]} />
          <meshStandardMaterial 
            color="#090a0b" 
            emissive="#ef4444"
            emissiveIntensity={0.1}
            wireframe={true} 
            transparent
            opacity={0.3}
          />
        </mesh>
        {/* Solid core to give the mountain depth */}
        <mesh position={[0, 2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[5.8, 11.5, 4]} />
          <meshStandardMaterial color="#0B0F19" />
        </mesh>
      </Float>

      {/* Secondary Peak */}
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh position={[6, 0, -3]} rotation={[0, -Math.PI / 6, 0]}>
          <coneGeometry args={[4, 8, 4]} />
          <meshStandardMaterial color="#ef4444" wireframe={true} transparent opacity={0.15} />
        </mesh>
        <mesh position={[6, 0, -3]} rotation={[0, -Math.PI / 6, 0]}>
          <coneGeometry args={[3.8, 7.5, 4]} />
          <meshStandardMaterial color="#0B0F19" />
        </mesh>
      </Float>
      
      {/* Tertiary Peak */}
      <Float speed={0.8} rotationIntensity={0.3} floatIntensity={0.4}>
        <mesh position={[-7, -1, -5]} rotation={[0, Math.PI / 3, 0]}>
          <coneGeometry args={[5, 10, 4]} />
          <meshStandardMaterial color="#847dff" wireframe={true} transparent opacity={0.15} />
        </mesh>
        <mesh position={[-7, -1, -5]} rotation={[0, Math.PI / 3, 0]}>
          <coneGeometry args={[4.8, 9.5, 4]} />
          <meshStandardMaterial color="#0B0F19" />
        </mesh>
      </Float>
    </group>
  );
}

// 2. Economic Constellation (Data Nodes)
function DataNodes() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate random positions for data nodes
  const nodes = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 30, // x
        (Math.random() - 0.5) * 15 + 5, // y (mostly above mountains)
        (Math.random() - 0.5) * 20 - 10, // z
      ] as [number, number, number],
      scale: Math.random() * 0.3 + 0.1,
      speed: Math.random() * 2 + 1,
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Slow majestic rotation of the entire constellation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      
      // Add slight parallax to the constellation as well
      const targetX = (state.pointer.x * 1);
      const targetY = (state.pointer.y * 0.5);
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.02;
      groupRef.current.position.y += (-targetY - groupRef.current.position.y) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <Float key={i} speed={node.speed} rotationIntensity={2} floatIntensity={3}>
          <mesh position={node.position} scale={node.scale}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial 
              color={i % 3 === 0 ? "#ef4444" : "#847dff"} 
              emissive={i % 3 === 0 ? "#ef4444" : "#847dff"}
              emissiveIntensity={0.8}
              wireframe={i % 2 === 0}
            />
          </mesh>
        </Float>
      ))}
      
      {/* Floating dust/particles to represent data flow */}
      <Sparkles count={150} scale={30} size={2} speed={0.4} opacity={0.3} color="#fca5a5" />
    </group>
  );
}

export default function Hero3DVisuals() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        {/* Warm Sunrise Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 5, -5]} intensity={2} color="#fef08a" />
        <pointLight position={[-10, 10, 10]} intensity={1} color="#ef4444" />
        
        <Environment preset="city" />
        
        <Mountain />
        <DataNodes />
      </Canvas>
      
      {/* Soft gradient overlays so text remains perfectly readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-sunset-fade via-sunset-fade/80 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-sunset-fade via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
