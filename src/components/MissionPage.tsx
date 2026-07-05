import React, { useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram, BookOpen, TrendingUp, BarChart3, ChevronRight, Lightbulb, Zap, Globe, ArrowUpRight, Users, ShieldCheck } from 'lucide-react';

// --- SHADER FOR 3D GRADIENT ---
const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

void main() {
  vec2 uv = vUv;
  
  // Create beautiful flowing noise
  float noise = cnoise(vec3(uv * 1.5, uTime * 0.15));
  float noise2 = cnoise(vec3(uv * 2.5, uTime * 0.1 + 10.0));
  
  // Combine noise for complex fluid feel
  float mixedNoise = smoothstep(-1.0, 1.0, noise + noise2 * 0.5);
  
  // Mix colors based on noise
  vec3 finalColor = mix(uColor1, uColor2, mixedNoise);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const GradientBackground = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    // Crimson Red: #dc143c -> rgb(220, 20, 60) -> normalized
    uColor1: { value: new THREE.Color(220/255, 20/255, 60/255) },
    // Deep Blue: #003893 -> rgb(0, 56, 147) -> normalized
    uColor2: { value: new THREE.Color(0/255, 56/255, 147/255) },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    // Gentle floating motion
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <planeGeometry args={[30, 20, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={false}
      />
    </mesh>
  );
};

// --- DATA ---
const coreValues = [
  { title: 'Gyan', desc: 'Knowledge First', icon: Lightbulb, details: 'Real market understanding over surface-level finance tips. We teach how things actually work.' },
  { title: 'Parivartan', desc: 'Change Starts Here', icon: Zap, details: 'Youth who think economically transform nations. Every session plants a seed of change.' },
  { title: 'Samriddhi', desc: 'Prosperity for All', icon: Globe, details: 'Financial freedom is not a privilege — it is a skill. We make it accessible to every student.' },
  { title: 'Unnati', desc: 'Upward Always', icon: ArrowUpRight, details: 'Continuous learning, compounding improvement. Like a good portfolio, we grow over time.' },
  { title: 'Sahabhagita', desc: 'Community-Driven', icon: Users, details: 'We grow as a collective. Strong networks build stronger financial futures.' },
  { title: 'Satya', desc: 'Grounded in Truth', icon: ShieldCheck, details: 'No noise, no hype. Only evidence-based economic thinking that students can trust.' }
];

const teachings = [
  {
    title: 'Financial Literacy',
    icon: BookOpen,
    desc: 'Building the fundamental understanding of money, personal finance, and smart saving to secure a stable future.'
  },
  {
    title: 'Stock Market',
    icon: TrendingUp,
    desc: 'Navigating NEPSE and global markets, analyzing trends, and making informed investment decisions.'
  },
  {
    title: 'Economic Research',
    icon: BarChart3,
    desc: 'Deep-diving into macroeconomic indicators, policies, and real-world impacts to think critically about growth.'
  }
];

const boardMembers = [
  { name: 'Akshat Karki', role: 'President' },
  { name: 'Manash Koirala', role: 'Vice President' },
  { name: 'Pranjal Khatiwada', role: 'Secretary' },
  { name: 'Ujjwal Dhungana', role: 'Head of Research' }
];

// --- VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function MissionPage() {
  const [activeTeachIndex, setActiveTeachIndex] = useState<number | null>(null);
  const [activeCoreValue, setActiveCoreValue] = useState<string | null>(null);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col bg-[#f8f9fa] text-slate-900 font-sans min-h-screen"
    >
      {/* --- HERO SECTION (3D GRADIENT) --- */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-slate-900">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <GradientBackground />
          </Canvas>
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
        </div>
        
        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-bold tracking-tight mb-4"
            style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', lineHeight: 1 }}
          >
            ARTHNEETI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-3xl font-light tracking-wide text-white/90"
          >
            Think Big. Invest Smart. Lead Nepal.
          </motion.p>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/60 text-sm uppercase tracking-widest">Discover</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent"
          />
        </motion.div>
      </section>

      {/* --- MISSION & VISION --- */}
      <section className="py-24 px-6 relative bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="absolute -left-4 -top-4 w-12 h-12 bg-[#dc143c]/10 rounded-full blur-xl" />
            <h2 className="text-[#003893] text-sm font-bold uppercase tracking-widest mb-4">Our Mission</h2>
            <p className="text-3xl md:text-5xl font-medium leading-tight text-slate-800">
              Empowering Nepal's next generation with real <span className="text-[#dc143c]">financial intelligence.</span>
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative flex flex-col justify-end"
          >
            <h2 className="text-[#003893] text-sm font-bold uppercase tracking-widest mb-4">Our Vision</h2>
            <p className="text-2xl md:text-4xl font-light leading-snug text-slate-600">
              A Nepal where youth <span className="font-semibold text-[#003893]">lead</span> economic change, not follow it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- CORE VALUES --- */}
      <section className="py-24 px-6 bg-[#f8f9fa] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#003893]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#dc143c]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Core Values</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">The principles that drive our community forward.</p>
          </div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {coreValues.map((value, idx) => {
              const Icon = value.icon;
              const isActive = activeCoreValue === value.title;
              return (
                <motion.div
                  key={value.title}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => setActiveCoreValue(isActive ? null : value.title)}
                  className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 group relative overflow-hidden cursor-pointer flex flex-col"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#dc143c] to-[#003893] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  <span className="text-[#003893]/20 font-bold text-5xl absolute top-4 right-6 pointer-events-none transition-colors group-hover:text-[#003893]/10">
                    0{idx + 1}
                  </span>
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${isActive ? 'bg-[#003893] text-white' : 'bg-slate-50 text-[#dc143c] group-hover:bg-[#dc143c]/10'}`}>
                    <Icon size={24} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-2 relative z-10">{value.title}</h3>
                  <p className="text-slate-500 font-medium relative z-10">{value.desc}</p>
                  
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-100"
                      >
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {value.details}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* --- WHAT WE TEACH --- */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="md:w-1/3 sticky top-24">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">What We Teach</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                We bridge the gap between textbook economics and real-world wealth generation through comprehensive, interactive learning.
              </p>
              <div className="hidden md:flex flex-col gap-2">
                {teachings.map((item, idx) => (
                  <button
                    key={item.title}
                    onMouseEnter={() => setActiveTeachIndex(idx)}
                    onMouseLeave={() => setActiveTeachIndex(null)}
                    className={`text-left px-4 py-3 rounded-lg transition-all duration-300 font-medium flex items-center justify-between ${
                      activeTeachIndex === idx ? 'bg-[#003893]/5 text-[#003893]' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {item.title}
                    <ChevronRight size={16} className={`transition-transform ${activeTeachIndex === idx ? 'translate-x-1' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="md:w-2/3 flex flex-col gap-6">
              {teachings.map((teach, idx) => {
                const Icon = teach.icon;
                const isActive = activeTeachIndex === idx;
                return (
                  <motion.div
                    key={teach.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    onMouseEnter={() => setActiveTeachIndex(idx)}
                    onMouseLeave={() => setActiveTeachIndex(null)}
                    className={`p-8 rounded-3xl border transition-all duration-500 ${
                      isActive 
                        ? 'border-[#003893]/20 bg-[#003893]/[0.02] shadow-xl shadow-[#003893]/5' 
                        : 'border-slate-100 bg-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500 ${
                      isActive ? 'bg-[#003893] text-white' : 'bg-slate-50 text-[#dc143c]'
                    }`}>
                      <Icon size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">{teach.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-lg mb-6">{teach.desc}</p>
                    <Link to="/learn" className="inline-flex items-center gap-2 text-sm font-semibold text-[#dc143c] hover:text-[#003893] transition-colors">
                      Learn More <ChevronRight size={16} />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* --- BOARD OF DIRECTORS --- */}
      <section className="py-24 px-6 bg-[#f8f9fa]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Board of Directors</h2>
            <p className="text-slate-500">The leaders behind Arthneeti's vision.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {boardMembers.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="group text-center"
              >
                <div className="relative w-48 h-48 mx-auto mb-6 overflow-hidden rounded-full border-4 border-white shadow-lg bg-white">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=003893&color=fff&size=256&font-size=0.33`}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 rounded-full border border-black/5" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{member.name}</h3>
                <p className="text-[#dc143c] font-medium text-sm tracking-wide uppercase">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </motion.main>
  );
}
