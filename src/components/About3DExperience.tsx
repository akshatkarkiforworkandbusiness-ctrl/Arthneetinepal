import { useState, useRef, useMemo } from 'react';
import { Pointer, Rocket, Shield, Diamond, Monitor } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';

// The four pillars of content
const CONTENT_NODES = [
  {
    id: 'mission',
    title: 'Our Mission',
    color: '#00875a',
    position: [0, 1.5, 2.5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    content: "Empowering Nepal's next generation with real financial intelligence. We travel across Nepal, bringing interactive workshops to every high school student.",
    Icon: Rocket
  },
  {
    id: 'work',
    title: 'Our Work',
    color: '#2563eb',
    position: [2.5, -0.5, 1.5] as [number, number, number],
    rotation: [0, Math.PI / 6, 0] as [number, number, number],
    content: "We provide full session curriculums, professional guest speakers, and simulated markets. Active in over 50 schools nationwide.",
    Icon: Shield
  },
  {
    id: 'values',
    title: 'Core Values',
    color: '#00875a',
    position: [-2.5, -0.5, 1.5] as [number, number, number],
    rotation: [0, -Math.PI / 6, 0] as [number, number, number],
    content: "Knowledge First. Prosperity for All. Grounded in Truth. We believe financial freedom is a skill, not a privilege.",
    Icon: Diamond
  },
  {
    id: 'features',
    title: 'The Platform',
    color: '#9333ea',
    position: [0, -2, 2.5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    content: "Track live NEPSE data, take guided video courses, test your knowledge with quizzes, and earn printable certificates.",
    Icon: Monitor
  }
];

function CardNode({ data, activeId, setActiveId }: { data: typeof CONTENT_NODES[0], activeId: string | null, setActiveId: (id: string | null) => void }) {
  const isActive = activeId === data.id;
  const isBlurred = activeId !== null && !isActive;

  return (
    <Float
      speed={isActive ? 1 : 2} 
      rotationIntensity={isActive ? 0.2 : 0.5} 
      floatIntensity={isActive ? 0.5 : 1.5}
      position={data.position}
      rotation={data.rotation}
    >
      <group>
        {/* Visual 3D Anchor */}
        <mesh>
          <sphereGeometry args={[isActive ? 0.12 : 0.15, 32, 32]} />
          <meshStandardMaterial 
            color={data.color} 
            emissive={data.color} 
            emissiveIntensity={isActive ? 1.5 : 0.3} 
            toneMapped={false} 
          />
        </mesh>
        
        {/* HTML UI Overlay */}
        <Html center zIndexRange={[100, 0]} position={[0, 0, 0]}>
          <motion.div
            layout
            initial={false}
            animate={{
              width: isActive ? 360 : 200,
              opacity: isBlurred ? 0.25 : 1,
              scale: isBlurred ? 0.9 : 1,
            }}
            onClick={() => setActiveId(isActive ? null : data.id)}
            className={`cursor-pointer overflow-hidden backdrop-blur-md rounded-2xl shadow-card transition-all duration-300 border ${
              isActive ? 'bg-white border-club-green shadow-elevated' : 'bg-white/90 hover:bg-white border-border'
            }`}
            style={{ pointerEvents: isBlurred ? 'none' : 'auto' }}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-1">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: `${data.color}15`, border: `1px solid ${data.color}40` }}
                >
                  <span className="text-lg" style={{ color: data.color }}>
                    <data.Icon size={18} />
                  </span>
                </div>
                <h3 className={`font-display font-bold transition-all ${isActive ? 'text-xl text-text-primary' : 'text-base text-text-primary'}`}>
                  {data.title}
                </h3>
              </div>
              
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3"
                  >
                    <div className="w-full h-px bg-border mb-3" />
                    <p className="text-xs font-sans text-text-muted leading-relaxed">
                      {data.content}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveId(null);
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-club-green transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Html>
      </group>
    </Float>
  );
}

function AbstractCore() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
    }
  });

  const notes = useMemo(() => [
    { ry: -0.3, y: -0.5, color: '#00875a' },
    { ry: 0, y: 0, color: '#00F59B' },
    { ry: 0.3, y: 0.5, color: '#2563eb' },
  ], []);

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
      <group ref={groupRef}>
        {notes.map((note, i) => (
          <mesh key={i} position={[0, note.y, 0]} rotation={[0, note.ry, 0]}>
            <planeGeometry args={[2.2, 1.4]} />
            <meshStandardMaterial
              color={note.color}
              emissive={note.color}
              emissiveIntensity={0.2}
              transparent
              opacity={0.65}
              roughness={0.2}
              metalness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

        {/* Central seal */}
        <mesh position={[0, 0, 0.08]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 24]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function About3DExperience() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="w-full h-[650px] bg-[#F7FAF9] relative rounded-3xl overflow-hidden border border-border shadow-card">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#F7FAF9']} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} color="#FFFFFF" />
        <Environment preset="studio" />

        <OrbitControls 
          autoRotate 
          autoRotateSpeed={1}
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
        
        <group position={[0, 0.5, 0]}>
          <AbstractCore />
          
          {CONTENT_NODES.map((node) => (
            <CardNode 
              key={node.id} 
              data={node} 
              activeId={activeId} 
              setActiveId={setActiveId} 
            />
          ))}
        </group>

        <ContactShadows position={[0, -3.5, 0]} opacity={0.25} scale={20} blur={2} far={4} color="#00875a" />
      </Canvas>

      {/* Helper text overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <div className="bg-white/80 backdrop-blur border border-border px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-sm">
          <Pointer size={14} className="text-club-green" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">Click nodes to explore • Drag to rotate</span>
        </div>
      </div>
    </div>
  );
}
