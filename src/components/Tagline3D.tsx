import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text, OrbitControls, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';

// --- BRAND COLORS ---
const BRAND_GREEN = '#1D9E75';
const BRAND_TEAL = '#5DCAA5';
const BRAND_DARK = '#0f2a20';
const BRAND_GOLD = '#BA7517';

// --- FLOATING PARTICLES ---
function FloatingParticles({ count = 200 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10 - 5
        ] as [number, number, number],
        scale: Math.random() * 0.03 + 0.01,
        speed: Math.random() * 0.5 + 0.2,
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
        position[0] + Math.sin(time * speed + offset) * 0.5,
        position[1] + Math.cos(time * speed * 0.8 + offset) * 0.3,
        position[2]
      );
      
      dummy.scale.setScalar(scale * (1 + Math.sin(time * 2 + offset) * 0.3));
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color={BRAND_TEAL}
        emissive={BRAND_GREEN}
        emissiveIntensity={0.5}
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
}

// --- 3D TEXT WORD ---
function AnimatedWord3D({ 
  text, 
  position, 
  delay, 
  color = '#ffffff',
  isActive 
}: { 
  text: string; 
  position: [number, number, number]; 
  delay: number;
  color?: string;
  isActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useFrame((state) => {
    if (!meshRef.current || !visible) return;
    const time = state.clock.elapsedTime;
    
    // Floating animation
    meshRef.current.position.y = position[1] + Math.sin(time * 1.5 + delay * 0.001) * 0.1;
    
    // Subtle rotation
    meshRef.current.rotation.y = Math.sin(time * 0.5 + delay * 0.001) * 0.05;
  });

  if (!visible) return null;

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <Text
        ref={meshRef}
        position={position}
        fontSize={1.2}
        font="/fonts/DM-Sans-Bold.ttf"
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor={BRAND_GREEN}
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

// --- GROWING CHART LINE ---
function GrowingChart() {
  const progress = useRef(0);
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6, -1, -3),
      new THREE.Vector3(-4, -0.5, -3),
      new THREE.Vector3(-2, 0, -3),
      new THREE.Vector3(0, 0.5, -3),
      new THREE.Vector3(2, 1, -3),
      new THREE.Vector3(4, 1.5, -3),
      new THREE.Vector3(6, 2.5, -3),
    ]);
    
    const points = curve.getPoints(50);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Animate draw progress
    progress.current = Math.min(1, progress.current + 0.008);
    
    const drawRange = Math.floor(50 * progress.current);
    meshRef.current.geometry.setDrawRange(0, drawRange);
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <lineBasicMaterial color={BRAND_TEAL} linewidth={2} transparent opacity={0.6} />
    </mesh>
  );
}

// --- INTERACTIVE ORB ---
function InteractiveOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Follow mouse with delay
    meshRef.current.position.x += (mouse.current.x * 2 - meshRef.current.position.x) * 0.02;
    meshRef.current.position.y += (mouse.current.y * 1.5 - meshRef.current.position.y) * 0.02;
    
    // Pulse
    const scale = 1 + Math.sin(time * 2) * 0.1;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <sphereGeometry args={[0.8, 64, 64]} />
      <meshStandardMaterial
        color={BRAND_GREEN}
        emissive={BRAND_GREEN}
        emissiveIntensity={0.8}
        transparent
        opacity={0.15}
        wireframe
      />
    </mesh>
  );
}

// --- MAIN 3D SCENE ---
function TaglineScene({ activePhase }: { activePhase: number }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-5, 3, 2]} intensity={0.8} color={BRAND_GREEN} />
      <pointLight position={[5, -3, 2]} intensity={0.6} color={BRAND_TEAL} />

      {/* Background Elements */}
      <FloatingParticles count={150} />
      <GrowingChart />
      <InteractiveOrb />

      {/* Sparkles Effect */}
      <Sparkles
        count={100}
        scale={15}
        size={2}
        speed={0.4}
        opacity={0.4}
        color={BRAND_TEAL}
      />

      {/* 3D Text Animation */}
      {activePhase >= 1 && (
        <AnimatedWord3D
          text="THINK BIG."
          position={[0, 1.5, 0]}
          delay={0}
          color="#ffffff"
          isActive={activePhase >= 1}
        />
      )}
      
      {activePhase >= 2 && (
        <AnimatedWord3D
          text="INVEST SMART."
          position={[0, 0.2, 0]}
          delay={300}
          color={BRAND_TEAL}
          isActive={activePhase >= 2}
        />
      )}
      
      {activePhase >= 3 && (
        <AnimatedWord3D
          text="LEAD NEPAL."
          position={[0, -1.1, 0]}
          delay={600}
          color={BRAND_GOLD}
          isActive={activePhase >= 3}
        />
      )}

      {/* Camera Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

// --- MAIN COMPONENT ---
export default function Tagline3D() {
  const [activePhase, setActivePhase] = useState(0);
  const [showSkip, setShowSkip] = useState(true);

  useEffect(() => {
    const timers = [
      setTimeout(() => setActivePhase(1), 500),
      setTimeout(() => setActivePhase(2), 1800),
      setTimeout(() => setActivePhase(3), 3100),
      setTimeout(() => setShowSkip(false), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative w-full h-screen min-h-[600px] bg-[#0f2a20] overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
          <color attach="background" args={['#0f2a20']} />
          <TaglineScene activePhase={activePhase} />
        </Canvas>
      </div>

      {/* Gradient Overlays for Depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f2a20] via-transparent to-[#0f2a20]/50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f2a20]/30 via-transparent to-[#0f2a20]/30 pointer-events-none" />

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
            <p className="text-white/30 text-sm tracking-[0.2em]">
              ठूलो सोच · स्मार्ट लगानी · नेपाल नेतृत्व
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: activePhase >= 3 ? 1 : 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-[10px] uppercase tracking-widest">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-[#5DCAA5]/60 to-transparent"
        />
      </motion.div>

      {/* Interactive Hint */}
      {showSkip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-8 right-8 z-10"
        >
          <div className="bg-white/5 backdrop-blur border border-white/10 px-4 py-2 rounded-full inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-white/40">mouse</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Drag to interact
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
