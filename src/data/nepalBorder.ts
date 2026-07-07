// Simplified Nepal border coordinates for 3D map visualization
// These are approximate lat/lng values for the three regions

export interface RegionBounds {
  name: string;
  latMin: number;
  latMax: number;
  elevation: [number, number];
  color: string;
  hoverColor: string;
}

// Nepal's approximate geographic bounds
export const NEPAL_BOUNDS = {
  latMin: 26.37,
  latMax: 30.42,
  lngMin: 80.05,
  lngMax: 88.19,
};

// Three regions of Nepal
export const REGIONS: RegionBounds[] = [
  {
    name: 'Terai',
    latMin: 26.37,
    latMax: 26.87,
    elevation: [60, 305],
    color: '#C5E1A5',
    hoverColor: '#AED581',
  },
  {
    name: 'Hilly',
    latMin: 26.87,
    latMax: 28.5,
    elevation: [600, 3500],
    color: '#81C784',
    hoverColor: '#66BB6A',
  },
  {
    name: 'Himalayan',
    latMin: 28.5,
    latMax: 30.42,
    elevation: [3000, 8848],
    color: '#E3F2FD',
    hoverColor: '#BBDEFB',
  },
];

// Simplified Nepal border polygon (lat, lng pairs)
// This is a simplified outline for visualization purposes
export const NEPAL_BORDER_POINTS: [number, number][] = [
  // Western border
  [80.05, 28.5],
  [80.15, 28.8],
  [80.25, 29.1],
  [80.35, 29.4],
  [80.45, 29.7],
  [80.55, 30.0],
  [80.65, 30.2],
  [80.8, 30.35],
  // Northern border (Himalayan range)
  [81.0, 30.42],
  [81.5, 30.38],
  [82.0, 30.35],
  [82.5, 30.3],
  [83.0, 30.25],
  [83.5, 30.2],
  [84.0, 30.15],
  [84.5, 30.1],
  [85.0, 30.05],
  [85.5, 30.0],
  [86.0, 29.95],
  [86.5, 29.9],
  [87.0, 29.85],
  [87.5, 29.8],
  [88.0, 29.75],
  [88.19, 29.7],
  // Eastern border
  [88.19, 29.4],
  [88.15, 29.1],
  [88.1, 28.8],
  [88.05, 28.5],
  [88.0, 28.2],
  [87.95, 27.9],
  [87.9, 27.6],
  [87.85, 27.3],
  [87.8, 27.0],
  [87.75, 26.7],
  [87.7, 26.5],
  [87.65, 26.37],
  // Southern border (Terai plains)
  [87.3, 26.37],
  [87.0, 26.37],
  [86.7, 26.37],
  [86.4, 26.37],
  [86.1, 26.37],
  [85.8, 26.37],
  [85.5, 26.37],
  [85.2, 26.37],
  [84.9, 26.37],
  [84.6, 26.37],
  [84.3, 26.37],
  [84.0, 26.37],
  [83.7, 26.37],
  [83.4, 26.37],
  [83.1, 26.37],
  [82.8, 26.37],
  [82.5, 26.37],
  [82.2, 26.37],
  [81.9, 26.37],
  [81.6, 26.37],
  [81.3, 26.37],
  [81.0, 26.37],
  [80.7, 26.37],
  [80.4, 26.37],
  [80.05, 26.37],
  // Western border continuation
  [80.05, 26.5],
  [80.05, 26.7],
  [80.05, 26.9],
  [80.05, 27.1],
  [80.05, 27.3],
  [80.05, 27.5],
  [80.05, 27.7],
  [80.05, 27.9],
  [80.05, 28.1],
  [80.05, 28.3],
  [80.05, 28.5],
];

// Helper function to convert lat/lng to 3D coordinates
export function latLngTo3D(
  lat: number,
  lng: number,
  scale: number = 1
): [number, number, number] {
  const x = ((lng - NEPAL_BOUNDS.lngMin) / (NEPAL_BOUNDS.lngMax - NEPAL_BOUNDS.lngMin) - 0.5) * 10 * scale;
  const z = ((lat - NEPAL_BOUNDS.latMin) / (NEPAL_BOUNDS.latMax - NEPAL_BOUNDS.latMin) - 0.5) * 6 * scale;
  return [x, 0, z];
}

// Get elevation for a given latitude (simplified)
export function getElevationForLat(lat: number): number {
  if (lat < 26.87) {
    // Terai - low elevation
    return 150 + (lat - 26.37) * 300;
  } else if (lat < 28.5) {
    // Hilly - medium elevation
    return 600 + (lat - 26.87) * 1700;
  } else {
    // Himalayan - high elevation
    return 3000 + (lat - 28.5) * 3000;
  }
}

// Get region name for a given latitude
export function getRegionForLat(lat: number): string {
  if (lat < 26.87) return 'Terai';
  if (lat < 28.5) return 'Hilly';
  return 'Himalayan';
}
