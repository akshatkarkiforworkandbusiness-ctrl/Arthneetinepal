import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function AbstractShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={1.8}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1.5, 0.4, 128, 32]} />
        <meshStandardMaterial 
          color="#00875a" 
          emissive="#00F59B"
          emissiveIntensity={0.2}
          wireframe 
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Inner solid core for light theme depth */}
      <mesh>
        <torusKnotGeometry args={[1.4, 0.3, 128, 32]} />
        <meshStandardMaterial 
          color="#FFFFFF"
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
    </Float>
  );
}

export default function Hero3DObject() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2.5} color="#FFFFFF" />
        <directionalLight position={[-10, -10, -10]} intensity={1} color="#00F59B" />
        <Environment preset="studio" />
        <AbstractShape />
        <ContactShadows position={[0, -2.5, 0]} opacity={0.25} scale={10} blur={2.5} far={4} color="#00875a" />
      </Canvas>
      
      {/* Soft light vignettes to blend into #F7FAF9 background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#F7FAF9] via-transparent to-[#F7FAF9] opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#F7FAF9] via-transparent to-[#F7FAF9] opacity-60" />
    </div>
  );
}
