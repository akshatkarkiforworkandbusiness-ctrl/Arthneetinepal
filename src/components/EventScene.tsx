import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Floating Particles Background ───────────────────────────────── */

function Particles({ count = 80, color = '#059669' }: { count?: number; color?: string }) {
  const mesh = useRef<THREE.Points>(null!);
  const light = useRef<THREE.PointLight>(null!);

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      spd[i] = 0.002 + Math.random() * 0.008;
    }
    return [pos, spd];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();
    const posAttr = mesh.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i];
      arr[i * 3] += Math.sin(time * 0.3 + i) * 0.001;
      if (arr[i * 3 + 1] > 6) arr[i * 3 + 1] = -6;
    }
    posAttr.needsUpdate = true;
    mesh.current.rotation.y = time * 0.02;
    if (light.current) {
      light.current.position.x = Math.sin(time * 0.5) * 4;
      light.current.position.y = Math.cos(time * 0.3) * 3;
    }
  });

  return (
    <>
      <pointLight ref={light} color={color} intensity={2} distance={15} />
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.06} transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </>
  );
}

/* ── Floating Ring ───────────────────────────────────────────────── */

function FloatingRing({ position, scale = 1, speed = 1 }: { position: [number, number, number]; scale?: number; speed?: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.rotation.x = Math.sin(t * 0.5) * 0.3;
    ref.current.rotation.y = t * 0.2;
    ref.current.position.y = position[1] + Math.sin(t * 0.4) * 0.5;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <torusGeometry args={[1, 0.03, 16, 64]} />
      <meshStandardMaterial color="#047857" transparent opacity={0.25} />
    </mesh>
  );
}

/* ── Main Scene ──────────────────────────────────────────────────── */

export default function EventScene({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} gl={{ alpha: true, antialias: false }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.1} />
        <Particles count={60} color="#059669" />
        <Particles count={30} color="#047857" />
        <FloatingRing position={[-4, 2, -3]} scale={0.8} speed={0.6} />
        <FloatingRing position={[5, -1, -4]} scale={1.2} speed={0.4} />
        <FloatingRing position={[0, 3, -5]} scale={0.6} speed={0.8} />
      </Canvas>
    </div>
  );
}
