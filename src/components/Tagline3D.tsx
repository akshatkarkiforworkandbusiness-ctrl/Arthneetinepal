import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';

// --- BRAND COLORS ---
const BRAND_GREEN = '#1D9E75';
const BRAND_TEAL = '#5DCAA5';
const BRAND_GOLD = '#BA7517';

// --- FLOATING PARTICLES ---
function FloatingParticles({ count = 100 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 8 - 4
        ] as [number, number, number],
        scale: Math.random() * 0.04 + 0.02,
        speed: Math.random() * 0.3 + 0.1,
        offset: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;
    
    particles.forEach((particle, i) => {
      const { position, scale, speed, offset } = particle;
      
      dummy.position.set(
        position[0] + Math.sin(time * speed + offset) * 0.3,
        position[1] + Math.cos(time * speed * 0.7 + offset) * 0.2,
        position[2]
      );
      
      dummy.scale.setScalar(scale * (1 + Math.sin(time * 1.5 + offset) * 0.2));
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={BRAND_TEAL}
        emissive={BRAND_GREEN}
        emissiveIntensity={0.8}
        transparent
        opacity={0.7}
      />
    </instancedMesh>
  );
}

// --- 3D TEXT WORD (Fixed - no custom font) ---
function AnimatedWord3D({ 
  text, 
  position, 
  delay, 
  color = '#ffffff'
}: { 
  text: string; 
  position: [number, number, number]; 
  delay: number;
  color?: string;
}) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <Text
        position={position}
        fontSize={0.8}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#000000"
      >
        {text}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          toneMapped={false}
        />
      </Text>
    </Float>
  );
}

// --- ORBITING RINGS ---
function OrbitingRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.3;
      ring1Ref.current.rotation.y = time * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -time * 0.2;
      ring2Ref.current.rotation.z = time * 0.3;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = time * 0.4;
      ring3Ref.current.rotation.z = -time * 0.2;
    }
  });

  return (
    <group position={[0, 0, -3]}>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.5, 0.02, 16, 100]} />
        <meshStandardMaterial color={BRAND_TEAL} emissive={BRAND_TEAL} emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3, 0.015, 16, 100]} />
        <meshStandardMaterial color={BRAND_GREEN} emissive={BRAND_GREEN} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[3.5, 0.01, 16, 100]} />
        <meshStandardMaterial color={BRAND_GOLD} emissive={BRAND_GOLD} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

// --- CENTRAL GLOW ---
function CentralGlow() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const scale = 1 + Math.sin(time * 2) * 0.15;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color={BRAND_GREEN}
        emissive={BRAND_GREEN}
        emissiveIntensity={2}
        transparent
        opacity={0.3}
        toneMapped={false}
      />
    </mesh>
  );
}

// --- MAIN 3D SCENE ---
function TaglineScene({ activePhase }: { activePhase: number }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, 3, 3]} intensity={1} color={BRAND_GREEN} />
      <pointLight position={[5, -3, 3]} intensity={0.8} color={BRAND_TEAL} />

      {/* Background Elements */}
      <FloatingParticles count={80} />
      <OrbitingRings />
      <CentralGlow />

      {/* Sparkles Effect */}
      <Sparkles
        count={60}
        scale={12}
        size={3}
        speed={0.3}
        opacity={0.5}
        color={BRAND_TEAL}
      />

      {/* 3D Text Animation - Phase by Phase */}
      {activePhase >= 1 && (
        <AnimatedWord3D
          text="THINK BIG."
          position={[0, 1.2, 0]}
          delay={0}
          color="#ffffff"
        />
      )}
      
      {activePhase >= 2 && (
        <AnimatedWord3D
          text="INVEST SMART."
          position={[0, 0, 0]}
          delay={200}
          color={BRAND_TEAL}
        />
      )}
      
      {activePhase >= 3 && (
        <AnimatedWord3D
          text="LEAD NEPAL."
          position={[0, -1.2, 0]}
          delay={400}
          color={BRAND_GOLD}
        />
      )}

      {/* Camera Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

// --- MAIN COMPONENT ---
export default function Tagline3D() {
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setActivePhase(1), 500),
      setTimeout(() => setActivePhase(2), 1800),
      setTimeout(() => setActivePhase(3), 3100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative w-full h-screen min-h-[600px] bg-[#0f2a20] overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <color attach="background" args={['#0f2a20']} />
          <fog attach="fog" args={['#0f2a20', 5, 15]} />
          <TaglineScene activePhase={activePhase} />
        </Canvas>
      </div>

      {/* Gradient Overlays for Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f2a20] via-transparent to-[#0f2a20]/30 pointer-events-none" />

      {/* 2D Overlay - Brand Mark */}
      <div className="absolute top-8 left-8 z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex items-center gap-3"
        >
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
            <path d="M20 46 L32 24 L44 46Z" fill="#5DCAA5" opacity="0.6" />
            <polyline
              points="14,44 24,36 32,38 40,26 50,18"
              stroke="#5DCAA5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="50" cy="18" r="3" fill="#5DCAA5" />
          </svg>
          <span className="text-white/50 text-sm font-medium tracking-[0.3em] uppercase">
            Arthneeti
          </span>
        </motion.div>
      </div>

      {/* Nepali Subtitle */}
      <AnimatePresence>
        {activePhase >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-center"
          >
            <p className="text-white/40 text-sm tracking-[0.2em]">
              ठूलो सोच · स्मार्ट लगानी · नेपाल नेतृत्व
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: activePhase >= 3 ? 1 : 0 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-[10px] uppercase tracking-widest">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-[#5DCAA5]/60 to-transparent"
        />
      </motion.div>

      {/* Interaction Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 right-8 z-10"
      >
        <div className="bg-white/5 backdrop-blur border border-white/10 px-4 py-2 rounded-full inline-flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Drag to interact
          </span>
        </div>
      </motion.div>
    </div>
  );
}
