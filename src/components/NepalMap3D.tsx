import { useState, useMemo, useRef } from 'react';
import { Pointer } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';
import NepalRegion from './NepalRegion';
import { REGIONS, NEPAL_BOUNDS, getElevationForLat } from '../data/nepalBorder';
import { REGION_DETAILS } from '../data/regionInfo';

// Create geometry for a region band
function createRegionGeometry(latMin: number, latMax: number): THREE.BufferGeometry {
  const segments = 64;
  const geometry = new THREE.PlaneGeometry(10, 2, segments, segments);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);

  // Convert lat/lng to normalized coordinates
  const latRange = NEPAL_BOUNDS.latMax - NEPAL_BOUNDS.latMin;
  const normalizedLatMin = (latMin - NEPAL_BOUNDS.latMin) / latRange;
  const normalizedLatMax = (latMax - NEPAL_BOUNDS.latMin) / latRange;

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);

    // Normalize y to 0-1 range within this region
    const normalizedY = (y + 1) / 2; // -1 to 1 -> 0 to 1
    const lat = latMin + normalizedY * (latMax - latMin);
    
    // Get elevation based on latitude
    const elevation = getElevationForLat(lat);
    const normalizedElevation = elevation / 8848; // Normalize to 0-1

    // Set height based on elevation with some noise
    const noise = Math.sin(x * 3) * Math.cos(y * 5) * 0.1;
    positions.setZ(i, normalizedElevation * 2 + noise);

    // Add vertex colors for visual interest
    const region = REGIONS.find(r => latMin >= r.latMin && latMax <= r.latMax);
    if (region) {
      const baseColor = new THREE.Color(region.color);
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// Animated Nepal Map Scene
function NepalMapScene() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Create geometries for each region
  const regionGeometries = useMemo(() => {
    return REGIONS.map(region => ({
      ...region,
      geometry: createRegionGeometry(region.latMin, region.latMax),
    }));
  }, []);

  // Gentle rotation animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} color="#ffffff" castShadow />
      <pointLight position={[-5, 5, 5]} intensity={0.5} color="#6EE7B7" />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#A7F3D0" />

      {/* Nepal Regions */}
      {regionGeometries.map((regionData, idx) => {
        const regionInfo = REGION_DETAILS[idx];
        const yOffset = idx * 0.1; // Stack regions slightly
        return (
          <NepalRegion
            key={regionData.name}
            region={regionInfo}
            geometry={regionData.geometry}
            position={[0, yOffset, 0]}
            isSelected={selectedRegion === regionData.name}
            onSelect={setSelectedRegion}
          />
        );
      })}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>

      {/* Contact shadows for depth */}
      <ContactShadows position={[0, -0.49, 0]} opacity={0.3} scale={15} blur={2} far={5} />
    </group>
  );
}

// Main NepalMap3D Component
export default function NepalMap3D() {
  return (
    <div className="w-full h-[600px] bg-white relative rounded-3xl overflow-hidden border border-gray-100 shadow-lg">
      <Canvas camera={{ position: [0, 5, 8], fov: 45 }} shadows>
        <color attach="background" args={['#ffffff']} />
        <fog attach="fog" args={['#ffffff', 10, 20]} />
        
        <NepalMapScene />

        {/* Camera Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.5}
          minDistance={5}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* 2D Overlay - Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-sm">
          <Pointer size={16} className="text-gray-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Click regions to explore • Drag to rotate
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-6 right-6 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 p-4 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-gray-700 mb-3">Nepal's Three Regions</p>
          <div className="space-y-2">
            {REGIONS.map((region) => (
              <div key={region.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: region.color }}
                />
                <span className="text-xs text-gray-600">{region.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
