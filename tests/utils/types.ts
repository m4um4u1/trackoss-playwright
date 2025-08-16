// Route Types
export interface RoutePoint {
  latitude: number;
  longitude: number;
  elevation?: number;
  pointType: 'START_POINT' | 'WAYPOINT' | 'END_POINT';
  timestamp?: string;
}

export interface RouteRequest {
  name: string;
  description?: string;
  routeType: 'CYCLING' | 'WALKING' | 'RUNNING' | 'HIKING' | 'DRIVING';
  isPublic: boolean;
  points: RoutePoint[];
  metadata?: string;
}

export interface RouteResponse {
  id: string;
  name: string;
  description?: string;
  routeType: string;
  isPublic: boolean;
  points: RoutePoint[];
  metadata: string;
  totalDistance?: number;
  totalElevationGain?: number;
  estimatedDuration?: number;
  createdAt: string;
  updatedAt: string;
}

// Road Type Metadata
export interface RoadTypeSegment {
  roadType: string;
  startIndex: number;
  endIndex: number;
  distance: number;
  color: string;
  coordinates: [number, number][];
  surface?: string;
  osmData?: {
    highway?: string;
    surface?: string;
    bicycle?: string;
    foot?: string;
    name?: string;
  };
}

export interface RoadTypeStats {
  breakdown: RoadTypeStat[];
  totalDistance: number;
  totalTypes: number;
}

export interface RoadTypeStat {
  roadType: string;
  distance: number;
  percentage: string;
  segmentCount: number;
  color: string;
}

export interface RouteMetadata {
  roadTypeSegments?: RoadTypeSegment[];
  roadTypeStats?: RoadTypeStats;
  averageSpeed?: number;
  maxElevation?: number;
  minElevation?: number;
  startAddress?: string;
  endAddress?: string;
  waypoints?: string[];
  tags?: string[];
}

// Test Helpers
export interface TestRoute {
  id?: string;
  name: string;
  points: RoutePoint[];
}

export interface TestConfig {
  apiUrl: string;
  appUrl: string;
  timeout?: number;
}

// Map interaction types
export interface MapClickPoint {
  x: number;
  y: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// UI Component selectors
export const SELECTORS = {
  // Map
  map: 'mgl-map',
  mapCanvas: '.maplibregl-canvas',
  
  // Route components
  routeCard: '.route-card',
  routeDisplay: 'app-route-display',
  roadTypeStats: 'app-road-type-stats',
  
  // Road type UI
  roadTypeStatsContainer: '.road-type-stats',
  statsTitle: '.stats-title',
  percentageBar: '.percentage-bar',
  percentageSegment: '.percentage-segment',
  statsList: '.stats-list',
  statItem: '.stat-item',
  
  // Buttons and controls
  roadTypeToggle: '[data-testid="road-type-toggle"]',
  saveRouteButton: '[data-testid="save-route"]',
  exportRouteButton: '[data-testid="export-route"]',
  shareRouteButton: '[data-testid="share-route"]',
  
  // Forms
  routeNameInput: 'input[name="routeName"]',
  routeDescriptionInput: 'textarea[name="routeDescription"]',
  routeTypeSelect: 'select[name="routeType"]',
  
  // Navigation
  navRoutes: '[routerLink="/routes"]',
  navMap: '[routerLink="/map"]',
  navProfile: '[routerLink="/profile"]',
} as const;

// Helper functions for tests
export function generateTestPoints(count: number): RoutePoint[] {
  const points: RoutePoint[] = [];
  const baseLat = 52.520008;
  const baseLng = 13.404954;
  
  for (let i = 0; i < count; i++) {
    points.push({
      latitude: baseLat + (i * 0.001),
      longitude: baseLng + (i * 0.001),
      elevation: 34.0 + i,
      pointType: i === 0 ? 'START_POINT' : i === count - 1 ? 'END_POINT' : 'WAYPOINT'
    });
  }
  
  return points;
}

export function parseMetadata(metadataString: string): RouteMetadata {
  try {
    return JSON.parse(metadataString);
  } catch (error) {
    console.error('Failed to parse metadata:', error);
    return {};
  }
}

export function calculateTotalPercentage(stats: RoadTypeStat[]): number {
  return stats.reduce((sum, stat) => sum + parseFloat(stat.percentage), 0);
}

export function validateHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export function validatePercentage(percentage: string | number): boolean {
  const value = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  return value >= 0 && value <= 100;
}
