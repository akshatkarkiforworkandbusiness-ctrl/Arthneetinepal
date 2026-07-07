import { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { RegionInfo } from '../data/regionInfo';

interface NepalRegionProps {
  region: RegionInfo;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}

export default function NepalRegion({
  region,
  geometry,
  position,
  isSelected,
  onSelect,
}: NepalRegionProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Change cursor to pointer on hover
  useCursor(hovered);

  // Animate material on hover/select
  useFrame((state) => {
    if (materialRef.current) {
      const targetEmissiveIntensity = isSelected ? 0.3 : hovered ? 0.15 : 0;
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetEmissiveIntensity,
        0.1
      );
    }
    if (meshRef.current && hovered) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.02;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(isSelected ? null : region.id);
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        position={position}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          ref={materialRef}
          color={hovered ? region.color : region.color}
          emissive={region.color}
          emissiveIntensity={0}
          flatShading
          transparent
          opacity={isSelected ? 1 : hovered ? 0.95 : 0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Region Label */}
      {hovered && !isSelected && (
        <Html position={[position[0], position[1] + 0.3, position[2]]} center>
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-gray-100 pointer-events-none whitespace-nowrap">
            <span className="text-sm font-semibold text-gray-800">{region.name}</span>
          </div>
        </Html>
      )}

      {/* Detailed Info Panel */}
      {isSelected && (
        <Html position={[position[0], position[1] + 0.5, position[2]]} center>
          <div className="bg-white/98 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-gray-100 w-72 pointer-events-auto animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{region.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{region.name}</h3>
                <p className="text-xs text-gray-500">{region.nameNepali}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {region.description}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <p className="text-xs text-gray-500">Area</p>
                <p className="text-sm font-semibold text-gray-800">{region.stats.area}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <p className="text-xs text-gray-500">Elevation</p>
                <p className="text-sm font-semibold text-gray-800">{region.stats.elevation}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <p className="text-xs text-gray-500">Population</p>
                <p className="text-sm font-semibold text-gray-800">{region.stats.population}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Highlights:</p>
              <ul className="space-y-1">
                {region.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: region.color }} />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="w-full text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors py-2 border-t border-gray-100"
            >
              Close
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
