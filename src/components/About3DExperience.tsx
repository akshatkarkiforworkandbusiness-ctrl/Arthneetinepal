import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Html, OrbitControls, Environment, ContactShadows, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';

// The four pillars of content
const CONTENT_NODES = [
  {
    id: 'mission',
    title: 'Our Mission',
    color: '#059669',
    position: [0, 1.5, 2.5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    content: "Empowering Nepal's next generation with real financial intelligence. We travel across Nepal, bringing interactive workshops to every high school student.",
    icon: 'rocket_launch'
  },
  {
    id: 'work',
    title: 'Our Work',
    color: '#10b981',
    position: [2.5, -0.5, 1.5] as [number, number, number],
    rotation: [0, Math.PI / 6, 0] as [number, number, number],
    content: "We provide full session curriculums, professional guest speakers, and simulated markets. Active in over 50 schools nationwide.",
    icon: 'assured_workload'
  },
  {
    id: 'values',
    title: 'Core Values',
    color: '#047857',
    position: [-2.5, -0.5, 1.5] as [number, number, number],
    rotation: [0, -Math.PI / 6, 0] as [number, number, number],
    content: "Knowledge First. Prosperity for All. Grounded in Truth. We believe financial freedom is a skill, not a privilege.",
    icon: 'diamond'
  },
  {
    id: 'features',
    title: 'The Platform',
    color: '#10b981',
    position: [0, -2, 2.5] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    content: "Track live NEPSE data, take guided video courses, test your knowledge with quizzes, and earn printable certificates.",
    icon: 'devices'
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
                  <span className="material-symbols-outlined text-xl" style={{ color: data.color }}>
                    {data.icon}
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
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  // Folded note geometry — warped plane like a banknote caught mid-fold
  const noteGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2.4, 1.6, 32, 32);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Fold along the diagonal — creates a crease
      const fold = Math.sin((x + y) * 1.2) * 0.15;
      // Slight curl at edges
      const edgeCurl = Math.cos(x * 1.5) * 0.08 + Math.sin(y * 1.8) * 0.06;
      pos.setZ(i, fold + edgeCurl);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Guilloché-style wireframe overlay — concentric arcs like security-print linework
  const guillocheCount = 6;
  const guilloche = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < guillocheCount; i++) {
      const r = 0.5 + i * 0.22;
      const pts: THREE.Vector3[] = [];
      const segs = 48;
      for (let j = 0; j <= segs; j++) {
        const a = (j / segs) * Math.PI * 2;
        const wobble = Math.sin(a * 8 + i * 1.3) * 0.04;
        pts.push(new THREE.Vector3(
          Math.cos(a) * (r + wobble),
          Math.sin(a) * (r + wobble) * 0.7,
          0.02 + i * 0.005
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.006, 4, true);
      geos.push(tubeGeo);
    }
    return geos;
  }, []);

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8}>
      <group ref={groupRef}>
        {/* Folded banknote plane — solid base */}
        <mesh geometry={noteGeo}>
          <meshStandardMaterial
            color="#059669"
            emissive="#047857"
            emissiveIntensity={0.2}
            transparent
            opacity={0.45}
            roughness={0.4}
            metalness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Wireframe overlay — guilloché security pattern */}
        {guilloche.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.12 + i * 0.02}
              emissive="#10b981"
              emissiveIntensity={0.15}
            />
          </mesh>
        ))}

        {/* Central watermark region — subtle luminous rectangle */}
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[0.8, 0.5]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.06}
            emissive="#10b981"
            emissiveIntensity={0.4}
            side={THREE.DoubleSide}
          />
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
          <span className="material-symbols-outlined text-sm text-slate-400">touch_app</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Click nodes to explore • Drag to rotate</span>
        </div>
      </div>
    </div>
  );
}
