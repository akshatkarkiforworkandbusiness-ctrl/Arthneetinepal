import { useState, useRef, useMemo } from 'react';
import { Pointer, Rocket, Shield, Diamond, Monitor } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Html, OrbitControls, Environment, ContactShadows, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';

// The four pillars of content
const CONTENT_NODES = [
  {
    id: 'mission',
    title: 'Our Mission',
    color: '#847dff',
    position: [0, 1.5, 2.5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    content: "Empowering Nepal's next generation with real financial intelligence. We travel across Nepal, bringing interactive workshops to every high school student.",
    Icon: Rocket
  },
  {
    id: 'work',
    title: 'Our Work',
    color: '#3b82f6',
    position: [2.5, -0.5, 1.5] as [number, number, number],
    rotation: [0, Math.PI / 6, 0] as [number, number, number],
    content: "We provide full session curriculums, professional guest speakers, and simulated markets. Active in over 50 schools nationwide.",
    Icon: Shield
  },
  {
    id: 'values',
    title: 'Core Values',
    color: '#003893',
    position: [-2.5, -0.5, 1.5] as [number, number, number],
    rotation: [0, -Math.PI / 6, 0] as [number, number, number],
    content: "Knowledge First. Prosperity for All. Grounded in Truth. We believe financial freedom is a skill, not a privilege.",
    Icon: Diamond
  },
  {
    id: 'features',
    title: 'The Platform',
    color: '#847dff',
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
          <sphereGeometry args={[isActive ? 0.1 : 0.15, 32, 32]} />
          <meshStandardMaterial 
            color={data.color} 
            emissive={data.color} 
            emissiveIntensity={isActive ? 2 : 0.5} 
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
              opacity: isBlurred ? 0.2 : 1,
              scale: isBlurred ? 0.9 : 1,
            }}
            onClick={() => setActiveId(isActive ? null : data.id)}
            className={`cursor-pointer overflow-hidden backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transition-colors duration-500 ${
              isActive ? 'bg-[#0f172a]/90 border-white/20' : 'bg-[#1e293b]/60 hover:bg-[#1e293b]/80'
            }`}
            style={{ pointerEvents: isBlurred ? 'none' : 'auto' }}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg"
                  style={{ backgroundColor: `${data.color}20`, border: `1px solid ${data.color}50` }}
                >
                  <span className="text-xl" style={{ color: data.color }}>
                    <data.Icon size={20} />
                  </span>
                </div>
                <h3 className={`font-display font-bold transition-all ${isActive ? 'text-2xl text-white' : 'text-lg text-white/90'}`}>
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
                    className="mt-4"
                  >
                    <div className="w-full h-px bg-white/10 mb-4" />
                    <p className="text-sm font-sans text-slate-300 leading-relaxed">
                      {data.content}
                    </p>
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveId(null);
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
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

// Just a helper to re-import AnimatePresence locally since it wasn't in the top import
import { AnimatePresence } from 'motion/react';

function AbstractCore() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
    }
  });

  // Stacked currency notes — three planes at different angles, like a fan of banknotes
  const notes = useMemo(() => [
    { ry: -0.3, y: -0.5, color: '#003893' },
    { ry: 0, y: 0, color: '#3b82f6' },
    { ry: 0.3, y: 0.5, color: '#847dff' },
  ], []);

  // Security line pattern on each note
  const securityLines = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) {
      const pts: THREE.Vector3[] = [];
      const y = -0.6 + i * 0.3;
      for (let j = 0; j <= 20; j++) {
        const x = -1.0 + (j / 20) * 2.0;
        const z = Math.sin(x * 6 + i * 0.8) * 0.02;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      geos.push(new THREE.TubeGeometry(curve, 24, 0.004, 3, false));
    }
    return geos;
  }, []);

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.6}>
      <group ref={groupRef}>
        {/* Stacked banknote planes */}
        {notes.map((note, i) => (
          <mesh key={i} position={[0, note.y, 0]} rotation={[0, note.ry, 0]}>
            <planeGeometry args={[2.2, 1.4]} />
            <meshStandardMaterial
              color={note.color}
              emissive={note.color}
              emissiveIntensity={0.4}
              transparent
              opacity={0.55}
              roughness={0.3}
              metalness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

        {/* Security thread lines across notes */}
        {securityLines.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.2}
              emissive="#3b82f6"
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}

        {/* Central denomination seal — medallion */}
        <mesh position={[0, 0, 0.08]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 24]} />
          <meshStandardMaterial
            color="#847dff"
            emissive="#847dff"
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
        {/* Seal rim */}
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.012, 6, 24]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.4} emissive="#3b82f6" emissiveIntensity={0.3} />
        </mesh>

        {/* Corner data nodes — connected to notes */}
        {[
          [-0.9, -0.5, 0.05], [0.9, -0.5, 0.05],
          [-0.9, 0.5, 0.05], [0.9, 0.5, 0.05],
        ].map((pos, i) => (
          <group key={i} position={pos as [number, number, number]}>
            <mesh>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial
                color="#3b82f6"
                emissive="#3b82f6"
                emissiveIntensity={1.2}
              />
            </mesh>
          </group>
        ))}

        {/* Orbiting ring — data flow indicator */}
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.3, 0.008, 6, 64]} />
          <meshStandardMaterial color="#847dff" transparent opacity={0.25} emissive="#847dff" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

export default function About3DExperience() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="w-full h-[800px] bg-[#0B0F19] relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#0B0F19']} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        {/* Background Particles */}
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

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

        {/* Floor Shadow */}
        <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2} far={4} />
      </Canvas>

      {/* 2D Overlay Help Text */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <div className="bg-white/5 backdrop-blur border border-white/10 px-4 py-2 rounded-full inline-flex items-center gap-2">
          <Pointer size={16} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Click nodes to explore • Drag to rotate</span>
        </div>
      </div>
    </div>
  );
}
