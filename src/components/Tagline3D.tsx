import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';

// --- BRAND COLORS (Balanced Palette) ---
const BRAND_GREEN = '#059669';
const BRAND_TEAL = '#10b981';
const BRAND_LIGHT = '#34d399';

// --- FLOATING PARTICLES ---
function FloatingParticles({ count = 80 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6 - 3
        ] as [number, number, number],
        scale: Math.random() * 0.03 + 0.015,
        speed: Math.random() * 0.2 + 0.08,
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
        position[0] + Math.sin(time * speed + offset) * 0.2,
        position[1] + Math.cos(time * speed * 0.7 + offset) * 0.15,
        position[2]
      );
      
      dummy.scale.setScalar(scale * (1 + Math.sin(time * 1.2 + offset) * 0.15));
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
        emissiveIntensity={0.6}
        transparent
        opacity={0.5}
      />
    </instancedMesh>
  );
}

// --- 3D TEXT WORD ---
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
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.2}>
      <Text
        position={position}
        fontSize={0.7}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#0f172a"
      >
        {text}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
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

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.2;
      ring1Ref.current.rotation.y = time * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -time * 0.15;
      ring2Ref.current.rotation.z = time * 0.2;
    }
  });

  return (
    <group position={[0, 0, -2.5]}>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.2, 0.015, 16, 100]} />
        <meshStandardMaterial color={BRAND_TEAL} emissive={BRAND_TEAL} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.8, 0.01, 16, 100]} />
        <meshStandardMaterial color={BRAND_GREEN} emissive={BRAND_GREEN} emissiveIntensity={0.6} toneMapped={false} />
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
    const scale = 1 + Math.sin(time * 1.5) * 0.1;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1.5]}>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial
        color={BRAND_GREEN}
        emissive={BRAND_GREEN}
        emissiveIntensity={1.5}
        transparent
        opacity={0.25}
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-4, 2, 3]} intensity={0.8} color={BRAND_GREEN} />
      <pointLight position={[4, -2, 3]} intensity={0.6} color={BRAND_TEAL} />

      {/* Background Elements */}
      <FloatingParticles count={60} />
      <OrbitingRings />
      <CentralGlow />

      {/* Sparkles Effect */}
      <Sparkles
        count={40}
        scale={10}
        size={2}
        speed={0.2}
        opacity={0.4}
        color={BRAND_TEAL}
      />

      {/* 3D Text Animation - Phase by Phase */}
      {activePhase >= 1 && (
        <AnimatedWord3D
          text="THINK BIG."
          position={[0, 1, 0]}
          delay={0}
          color="#ffffff"
        />
      )}
      
      {activePhase >= 2 && (
        <AnimatedWord3D
          text="INVEST SMART."
          position={[0, 0, 0]}
          delay={150}
          color={BRAND_TEAL}
        />
      )}
      
      {activePhase >= 3 && (
        <AnimatedWord3D
          text="LEAD NEPAL."
          position={[0, -1, 0]}
          delay={300}
          color={BRAND_LIGHT}
        />
      )}

      {/* Camera Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
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
      setTimeout(() => setActivePhase(1), 600),
      setTimeout(() => setActivePhase(2), 1600),
      setTimeout(() => setActivePhase(3), 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative w-full h-screen min-h-[600px] bg-[#0f172a] overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 55 }}>
          <color attach="background" args={['#0f172a']} />
          <fog attach="fog" args={['#0f172a', 4, 12]} />
          <TaglineScene activePhase={activePhase} />
        </Canvas>
      </div>

      {/* Mountain Silhouette Background - Three Regions */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none">
        <svg
          viewBox="0 0 1440 400"
          className="w-full h-full"
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            <linearGradient id="taglineTerai" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="taglineHilly" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="taglineHimalayan" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#047857" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Terai - Flat plains */}
          <path
            d="M0,400 L0,340 Q360,320 720,330 Q1080,320 1440,340 L1440,400 Z"
            fill="url(#taglineTerai)"
          />

          {/* Hilly - Rolling hills */}
          <path
            d="M0,400 L0,300 Q180,250 360,280 Q540,220 720,260 Q900,200 1080,250 Q1260,210 1440,270 L1440,400 Z"
            fill="url(#taglineHilly)"
          />

          {/* Himalayan - Peaks */}
          <path
            d="M0,400 L0,250 Q120,150 240,210 Q360,100 480,180 Q600,60 720,150 Q840,50 960,130 Q1080,80 1200,170 Q1320,120 1440,220 L1440,400 Z"
            fill="url(#taglineHimalayan)"
          />
        </svg>
      </div>

      {/* Gradient Overlays for Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-[#0f172a]/50 pointer-events-none" />

      {/* 2D Overlay - Brand Mark */}
      <div className="absolute top-8 left-8 z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
            <path d="M20 46 L32 24 L44 46Z" fill="#10b981" opacity="0.7" />
            <polyline
              points="14,44 24,36 32,38 40,26 50,18"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="50" cy="18" r="3" fill="#10b981" />
          </svg>
          <span className="text-white/60 text-sm font-medium tracking-[0.3em] uppercase">
            Arthneeti
          </span>
        </motion.div>
      </div>

      {/* Nepali Subtitle */}
      <AnimatePresence>
        {activePhase >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 text-center"
          >
            <p className="text-white/35 text-sm tracking-[0.15em]">
              ठूलो सोच · स्मार्ट लगानी · नेपाल नेतृत्व
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: activePhase >= 3 ? 1 : 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/30 text-[10px] uppercase tracking-widest">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-px h-6 bg-gradient-to-b from-[#10b981]/50 to-transparent"
        />
      </motion.div>

      {/* Interaction Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
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
