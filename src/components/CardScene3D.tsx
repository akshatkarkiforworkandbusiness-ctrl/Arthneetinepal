import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Geometry per category ───────────────────────────────────────── */

const CATEGORY_SHAPES = {
  Workshop: 'box',
  Session: 'sphere',
  Conference: 'icosa',
  Meetup: 'torusKnot',
  Webinar: 'octa',
  Other: 'dodeca',
} as const;

type ShapeKey = keyof typeof CATEGORY_SHAPES;

/* ── Animated Shape ──────────────────────────────────────────────── */

function AnimatedShape({ color, shape }: { color: string; shape: string }) {
  const solidRef = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (solidRef.current) {
      solidRef.current.rotation.x = t * 0.4;
      solidRef.current.rotation.y = t * 0.6;
      solidRef.current.position.y = Math.sin(t * 1.2) * 0.15;
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = -t * 0.3;
      wireRef.current.rotation.y = -t * 0.5;
      wireRef.current.position.y = Math.sin(t * 1.2) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 1.5 + Math.sin(t * 2) * 0.5;
    }
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case 'box': return <boxGeometry args={[1.1, 1.1, 1.1]} />;
      case 'sphere': return <sphereGeometry args={[0.7, 32, 32]} />;
      case 'icosa': return <icosahedronGeometry args={[0.75, 0]} />;
      case 'torusKnot': return <torusKnotGeometry args={[0.5, 0.18, 128, 16]} />;
      case 'octa': return <octahedronGeometry args={[0.8, 0]} />;
      case 'dodeca': return <dodecahedronGeometry args={[0.7, 0]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  }, [shape]);

  const wireGeometry = useMemo(() => {
    switch (shape) {
      case 'box': return <boxGeometry args={[1.3, 1.3, 1.3]} />;
      case 'sphere': return <sphereGeometry args={[0.85, 16, 16]} />;
      case 'icosa': return <icosahedronGeometry args={[0.9, 1]} />;
      case 'torusKnot': return <torusKnotGeometry args={[0.6, 0.22, 64, 8]} />;
      case 'octa': return <octahedronGeometry args={[0.95, 1]} />;
      case 'dodeca': return <dodecahedronGeometry args={[0.85, 1]} />;
      default: return <boxGeometry args={[1.2, 1.2, 1.2]} />;
    }
  }, [shape]);

  return (
    <>
      <pointLight ref={glowRef} color={color} intensity={2} distance={5} />
      <ambientLight intensity={0.15} />

      {/* Solid core */}
      <mesh ref={solidRef}>
        {geometry}
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.35}
          roughness={0.2}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        {wireGeometry}
        <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
      </mesh>
    </>
  );
}

/* ── Orbiting Particles ──────────────────────────────────────────── */

function OrbitParticles({ color, count = 20 }: { color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.2 + Math.random() * 0.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.04} transparent opacity={0.7} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

/* ── Main Scene ──────────────────────────────────────────────────── */

export default function CardScene3D({ color, category }: { color: string; category: string }) {
  const shape = CATEGORY_SHAPES[category as ShapeKey] ?? CATEGORY_SHAPES.Other;

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
        <AnimatedShape color={color} shape={shape} />
        <OrbitParticles color={color} count={16} />
      </Canvas>
    </div>
  );
}
