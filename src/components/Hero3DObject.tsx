import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
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
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1.5, 0.4, 128, 32]} />
        <meshStandardMaterial 
          color="#00f59b" 
          emissive="#00875a"
          emissiveIntensity={0.5}
          wireframe 
          transparent
          opacity={0.2}
        />
      </mesh>
      {/* Inner solid core to give it depth */}
      <mesh>
        <torusKnotGeometry args={[1.4, 0.3, 128, 32]} />
        <meshStandardMaterial 
          color="#0B0F19" 
        />
      </mesh>
    </Float>
  );
}

export default function Hero3DObject() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <Environment preset="city" />
        <AbstractShape />
      </Canvas>
      
      {/* Gradients to fade out the edges so it blends nicely into the black background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
    </div>
  );
}
