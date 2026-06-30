import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Category → Shape mapping ────────────────────────────────────── */

const CATEGORY_SHAPES: Record<string, string> = {
  Workshop: 'barchart',
  Session: 'candlestick',
  Conference: 'globe',
  Meetup: 'piechart',
  Webinar: 'trendarrow',
  Other: 'coin',
};

/* ── Bar Chart (Workshop — learning, building) ───────────────────── */

function BarChart({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null!);
  const bars = useMemo(() => [
    { x: -0.6, h: 0.8, delay: 0 },
    { x: -0.2, h: 1.2, delay: 0.1 },
    { x: 0.2, h: 0.6, delay: 0.2 },
    { x: 0.6, h: 1.5, delay: 0.3 },
  ], []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.3) * 0.15;
    group.current.children.forEach((child, i) => {
      const bar = child as THREE.Mesh;
      const scale = 0.8 + Math.sin(t * 1.5 + bars[i].delay * 5) * 0.2;
      bar.scale.y = scale;
      bar.position.y = (bars[i].h * scale) / 2 - 0.4;
    });
  });

  return (
    <group ref={group} position={[0, 0.2, 0]}>
      {bars.map((bar, i) => (
        <mesh key={i} position={[bar.x, bar.h / 2 - 0.4, 0]}>
          <boxGeometry args={[0.22, bar.h, 0.22]} />
          <meshStandardMaterial color={color} transparent opacity={0.7} emissive={color} emissiveIntensity={0.4} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
      {/* Base platform */}
      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[1.6, 0.04, 0.4]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/* ── Candlestick (Session — stock trading) ───────────────────────── */

function Candlestick({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null!);
  const candles = useMemo(() => [
    { x: -0.5, body: 0.5, wick: 0.8, green: true },
    { x: -0.15, body: 0.7, wick: 0.4, green: false },
    { x: 0.2, body: 0.4, wick: 0.9, green: true },
    { x: 0.55, body: 0.6, wick: 0.5, green: true },
  ], []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = t * 0.2;
  });

  return (
    <group ref={group} position={[0, 0.1, 0]}>
      {candles.map((c, i) => (
        <group key={i} position={[c.x, 0, 0]}>
          {/* Wick */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, c.wick, 8]} />
            <meshStandardMaterial color={c.green ? '#00f59b' : '#ef4444'} transparent opacity={0.6} />
          </mesh>
          {/* Body */}
          <mesh position={[0, c.green ? -0.1 : 0.1, 0]}>
            <boxGeometry args={[0.12, c.body, 0.12]} />
            <meshStandardMaterial
              color={c.green ? color : '#ef4444'}
              transparent opacity={0.8}
              emissive={c.green ? color : '#ef4444'}
              emissiveIntensity={0.3}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── Globe with network (Conference — global finance) ────────────── */

function Globe({ color }: { color: string }) {
  const globeRef = useRef<THREE.Mesh>(null!);
  const ringsRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.3;
      globeRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z = t * 0.15;
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* Globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.25} wireframe roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Latitude rings */}
      <group ref={ringsRef}>
        {[0.4, 0.55, 0.7].map((r, i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, i * 0.5]}>
            <torusGeometry args={[r, 0.012, 8, 48]} />
            <meshStandardMaterial color={color} transparent opacity={0.4} emissive={color} emissiveIntensity={0.2} />
          </mesh>
        ))}
      </group>
      {/* Nodes on surface */}
      {[
        [0.5, 0.2, 0.1], [-0.3, 0.4, 0.3], [0.1, -0.3, 0.5],
        [-0.4, -0.1, -0.4], [0.3, 0.3, -0.3],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Pie Chart / Donut (Meetup — portfolio allocation) ───────────── */

function PieChart({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null!);
  const segments = useMemo(() => {
    const slices = [
      { start: 0, end: 0.35, color: color },
      { start: 0.35, end: 0.6, color: '#3b82f6' },
      { start: 0.6, end: 0.8, color: '#a855f7' },
      { start: 0.8, end: 1.0, color: '#f59e0b' },
    ];
    return slices.map((s) => {
      const shape = new THREE.Shape();
      const r = 0.55;
      const ir = 0.25;
      const segs = 32;
      const startAngle = s.start * Math.PI * 2;
      const endAngle = s.end * Math.PI * 2;

      shape.moveTo(Math.cos(startAngle) * ir, Math.sin(startAngle) * ir);
      for (let i = 0; i <= segs; i++) {
        const a = startAngle + (endAngle - startAngle) * (i / segs);
        shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      for (let i = segs; i >= 0; i--) {
        const a = startAngle + (endAngle - startAngle) * (i / segs);
        shape.lineTo(Math.cos(a) * ir, Math.sin(a) * ir);
      }
      return { shape, color: s.color };
    });
  }, [color]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = t * 0.25;
    group.current.rotation.x = Math.sin(t * 0.4) * 0.15;
  });

  return (
    <group ref={group} position={[0, 0.1, 0]} rotation={[0.3, 0, 0]}>
      {segments.map((seg, i) => (
        <mesh key={i}>
          <extrudeGeometry args={[seg.shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }]} />
          <meshStandardMaterial color={seg.color} transparent opacity={0.75} roughness={0.3} metalness={0.5} emissive={seg.color} emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Trend Arrow (Webinar — growth, progress) ────────────────────── */

function TrendArrow({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null!);

  // Arrow path points (upward trend)
  const curve = useMemo(() => {
    const pts = [
      new THREE.Vector3(-0.7, -0.4, 0),
      new THREE.Vector3(-0.3, -0.1, 0),
      new THREE.Vector3(0.1, -0.2, 0),
      new THREE.Vector3(0.4, 0.2, 0),
      new THREE.Vector3(0.7, 0.5, 0),
    ];
    return new THREE.CatmullRomCurve3(pts);
  }, []);

  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 48, 0.035, 8, false);
  }, [curve]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.3) * 0.2;
    group.current.position.y = Math.sin(t * 0.8) * 0.05;
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Trend line */}
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Arrow head */}
      <mesh position={[0.7, 0.55, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.08, 0.18, 4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Data points along the curve */}
      {[-0.7, -0.3, 0.1, 0.4, 0.7].map((x, i) => {
        const y = curve.getPointAt((x + 0.7) / 1.4).y;
        return (
          <mesh key={i} position={[x, y, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={0.8} />
          </mesh>
        );
      })}
      {/* Grid lines */}
      {[-0.5, 0, 0.5].map((y, i) => (
        <mesh key={i} position={[0, y, -0.05]}>
          <planeGeometry args={[1.6, 0.003]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Coin (Other — currency, money) ──────────────────────────────── */

function Coin({ color }: { color: string }) {
  const coinRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!coinRef.current) return;
    const t = state.clock.getElapsedTime();
    coinRef.current.rotation.y = t * 0.4;
    coinRef.current.rotation.x = Math.sin(t * 0.6) * 0.15;
    coinRef.current.position.y = Math.sin(t * 1.2) * 0.08;
  });

  // Dollar sign shape
  const dollarShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Vertical line of $
    shape.moveTo(0, -0.25);
    shape.lineTo(0, 0.25);
    // Curves
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.15, 0.15, 0),
      new THREE.Vector3(-0.15, 0.0, 0),
      new THREE.Vector3(0, 0.05, 0)
    );
    const pts = curve.getPoints(12);
    pts.forEach(p => shape.lineTo(p.x, p.y));
    const curve2 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(0.15, -0.05, 0),
      new THREE.Vector3(0.15, -0.15, 0)
    );
    curve2.getPoints(12).forEach(p => shape.lineTo(p.x, p.y));
    return shape;
  }, []);

  return (
    <group ref={coinRef} position={[0, 0.1, 0]}>
      {/* Coin body */}
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 48]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} roughness={0.2} metalness={0.8} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Coin edge ring */}
      <mesh>
        <torusGeometry args={[0.5, 0.025, 8, 48]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.4} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Inner ring */}
      <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.015, 8, 48]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.25} />
      </mesh>
      {/* Dollar symbol (extruded) */}
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[dollarShape, { depth: 0.03, bevelEnabled: false }]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.5} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/* ── Orbiting Particles ──────────────────────────────────────────── */

function OrbitParticles({ color, count = 18 }: { color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.1 + Math.random() * 0.4;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.25;
    ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.15) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.035} transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

/* ── Main Scene ──────────────────────────────────────────────────── */

export default function CardScene3D({ color, category }: { color: string; category: string }) {
  const shape = CATEGORY_SHAPES[category] ?? CATEGORY_SHAPES.Other;

  const ShapeComponent = useMemo(() => {
    switch (shape) {
      case 'barchart': return BarChart;
      case 'candlestick': return Candlestick;
      case 'globe': return Globe;
      case 'piechart': return PieChart;
      case 'trendarrow': return TrendArrow;
      case 'coin': return Coin;
      default: return Coin;
    }
  }, [shape]);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
        <ambientLight intensity={0.15} />
        <pointLight position={[2, 2, 2]} color={color} intensity={2} distance={8} />
        <pointLight position={[-2, -1, 1]} color="#ffffff" intensity={0.5} distance={6} />
        <ShapeComponent color={color} />
        <OrbitParticles color={color} count={16} />
      </Canvas>
    </div>
  );
}
