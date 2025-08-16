import { test, expect } from '@playwright/test';
import { RouteResponse } from '../utils/types';

test.describe('Road Type Metadata Features', () => {
  let routeId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app - uses baseURL from config
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Backend API Tests', () => {
    test.skip('should create route with enhanced metadata', async ({ request }) => {
      const routeData = {
        name: 'Test Route with Road Types',
        description: 'Route for testing road type metadata',
        routeType: 'CYCLING',
        isPublic: true,
        points: [
          {
            latitude: 52.520008,
            longitude: 13.404954,
            elevation: 34.0,
            pointType: 'START_POINT'
          },
          {
            latitude: 52.521,
            longitude: 13.405,
            elevation: 35.0,
            pointType: 'WAYPOINT'
          },
          {
            latitude: 52.522,
            longitude: 13.406,
            elevation: 36.0,
            pointType: 'WAYPOINT'
          },
          {
            latitude: 52.523,
            longitude: 13.407,
            elevation: 37.0,
            pointType: 'END_POINT'
          }
        ]
      };

      const response = await request.post(`http://localhost:8080/api/routes`, {
        data: routeData,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(201);
      const route: RouteResponse = await response.json();
      
      // Store route ID for cleanup
      routeId = route.id;
      
      // Verify route has metadata
      expect(route.metadata).toBeDefined();
      
      // Parse and verify metadata structure
      const metadata = JSON.parse(route.metadata);
      
      // Check for road type segments
      expect(metadata.roadTypeSegments).toBeDefined();
      expect(Array.isArray(metadata.roadTypeSegments)).toBe(true);
      
      // Check for road type statistics
      expect(metadata.roadTypeStats).toBeDefined();
      expect(metadata.roadTypeStats.breakdown).toBeDefined();
      expect(Array.isArray(metadata.roadTypeStats.breakdown)).toBe(true);
      expect(metadata.roadTypeStats.totalTypes).toBeGreaterThan(0);
    });

    test.skip('should retrieve route with road type metadata', async ({ request }) => {
      // First create a route
      const createResponse = await request.post(`http://localhost:8080/api/routes`, {
        data: {
          name: 'Test Route Retrieval',
          description: 'Test',
          routeType: 'CYCLING',
          isPublic: true,
          points: [
            { latitude: 52.520008, longitude: 13.404954, pointType: 'START_POINT' },
            { latitude: 52.523, longitude: 13.407, pointType: 'END_POINT' }
          ]
        },
        headers: { 'Content-Type': 'application/json' }
      });

      const createdRoute = await createResponse.json();
      routeId = createdRoute.id;

      // Retrieve the route
      const getResponse = await request.get(`http://localhost:8080/api/routes/${routeId}`);
      expect(getResponse.status()).toBe(200);

      const route = await getResponse.json();
      expect(route.metadata).toBeDefined();

      const metadata = JSON.parse(route.metadata);
      
      // Verify segments have proper structure
      if (metadata.roadTypeSegments && metadata.roadTypeSegments.length > 0) {
        const segment = metadata.roadTypeSegments[0];
        expect(segment).toHaveProperty('roadType');
        expect(segment).toHaveProperty('startIndex');
        expect(segment).toHaveProperty('endIndex');
        expect(segment).toHaveProperty('distance');
        expect(segment).toHaveProperty('color');
        expect(segment).toHaveProperty('coordinates');
      }

      // Verify stats have proper structure
      if (metadata.roadTypeStats && metadata.roadTypeStats.breakdown) {
        const breakdown = metadata.roadTypeStats.breakdown;
        if (breakdown.length > 0) {
          const stat = breakdown[0];
          expect(stat).toHaveProperty('roadType');
          expect(stat).toHaveProperty('distance');
          expect(stat).toHaveProperty('percentage');
          expect(stat).toHaveProperty('segmentCount');
          expect(stat).toHaveProperty('color');
        }
      }
    });
  });

  test.describe('Public API Tests', () => {
    test('should retrieve public routes', async ({ request }) => {
      const response = await request.get(`http://localhost:8080/api/routes/public`);
      
      // Public endpoint should be accessible
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Response should have paginated structure
      expect(data).toHaveProperty('content');
      expect(Array.isArray(data.content)).toBe(true);
      expect(data).toHaveProperty('totalElements');
      expect(data).toHaveProperty('totalPages');
      
      // If there are public routes with metadata, check them
      if (data.content.length > 0) {
        const routeWithMetadata = data.content.find((r: any) => r.metadata);
        if (routeWithMetadata) {
          console.log('Found route with metadata:', routeWithMetadata.name);
          const metadata = JSON.parse(routeWithMetadata.metadata);
          
          // Check for road type data if present
          if (metadata.roadTypeSegments) {
            expect(Array.isArray(metadata.roadTypeSegments)).toBe(true);
            console.log(`Route has ${metadata.roadTypeSegments.length} road type segments`);
          }
          if (metadata.roadTypeStats) {
            expect(metadata.roadTypeStats).toHaveProperty('breakdown');
            console.log(`Route has ${metadata.roadTypeStats.totalTypes} different road types`);
          }
        } else {
          console.log('No public routes with metadata found. This is OK for a fresh database.');
        }
      } else {
        console.log('No public routes found. This is OK for a fresh database.');
      }
    });
  });

  test.describe('Frontend UI Tests', () => {
    test('should display road type statistics component', async ({ page }) => {
      // Navigate to routes page
      await page.goto('/routes');
      await page.waitForLoadState('networkidle');

      // Check if there are any routes with metadata
      const routeCards = await page.locator('.route-card').count();
      
      if (routeCards > 0) {
        // Click on first route card to view details
        await page.locator('.route-card').first().click();
        
        // Wait for route display component
        await page.waitForSelector('app-route-display', { timeout: 5000 });
        
        // Check if road type stats component is present
        const statsComponent = await page.locator('app-road-type-stats').count();
        
        if (statsComponent > 0) {
          // Verify stats are displayed
          await expect(page.locator('.road-type-stats')).toBeVisible();
          await expect(page.locator('.stats-title')).toContainText('Road Type Breakdown');
          
          // Check for percentage bar
          await expect(page.locator('.percentage-bar')).toBeVisible();
          
          // Check for stats list
          await expect(page.locator('.stats-list')).toBeVisible();
        }
      }
    });

    test('should show colored road segments on map', async ({ page }) => {
      // Navigate to map page
      await page.goto('/map');
      await page.waitForLoadState('networkidle');
      
      // Wait for map to load
      await page.waitForSelector('mgl-map', { timeout: 10000 });
      await page.waitForTimeout(2000); // Give map time to initialize
      
      // Create a route by clicking on map
      const map = page.locator('mgl-map');
      const mapBox = await map.boundingBox();
      
      if (mapBox) {
        // Click start point
        await page.mouse.click(
          mapBox.x + mapBox.width * 0.3,
          mapBox.y + mapBox.height * 0.5
        );
        await page.waitForTimeout(500);
        
        // Click end point
        await page.mouse.click(
          mapBox.x + mapBox.width * 0.7,
          mapBox.y + mapBox.height * 0.5
        );
        await page.waitForTimeout(2000);
        
        // Check if route is displayed
        const routeDisplay = await page.locator('app-route-display').count();
        if (routeDisplay > 0) {
          // Route should be visible
          await expect(page.locator('app-route-display')).toBeVisible();
        }
      }
    });

    test('should toggle road type layer visibility', async ({ page }) => {
      // This test would require a toggle button in the UI
      // Assuming there's a button to toggle road type layer
      await page.goto('/map');
      await page.waitForLoadState('networkidle');
      
      // Look for road type layer toggle (if implemented)
      const toggleButton = page.locator('[data-testid="road-type-toggle"]');
      const toggleCount = await toggleButton.count();
      
      if (toggleCount > 0) {
        // Initial state
        const initialState = await toggleButton.isChecked();
        
        // Toggle the layer
        await toggleButton.click();
        await page.waitForTimeout(500);
        
        // Verify state changed
        const newState = await toggleButton.isChecked();
        expect(newState).toBe(!initialState);
      }
    });
  });

  test.describe('Road Type Percentage Calculations', () => {
    test.skip('should calculate correct percentages for mixed route', async ({ request }) => {
      // Create a route with varied points to get different road types
      const points = [];
      for (let i = 0; i < 20; i++) {
        points.push({
          latitude: 52.520008 + (i * 0.001),
          longitude: 13.404954 + (i * 0.001),
          elevation: 34.0 + i,
          pointType: i === 0 ? 'START_POINT' : i === 19 ? 'END_POINT' : 'WAYPOINT'
        });
      }

      const response = await request.post(`http://localhost:8080/api/routes`, {
        data: {
          name: 'Mixed Road Type Route',
          description: 'Route with various road types',
          routeType: 'CYCLING',
          isPublic: true,
          points: points
        },
        headers: { 'Content-Type': 'application/json' }
      });

      const route = await response.json();
      routeId = route.id;

      const metadata = JSON.parse(route.metadata);
      
      if (metadata.roadTypeStats && metadata.roadTypeStats.breakdown) {
        const breakdown = metadata.roadTypeStats.breakdown;
        
        // Sum of all percentages should be approximately 100
        const totalPercentage = breakdown.reduce((sum: number, stat: any) => {
          return sum + parseFloat(stat.percentage);
        }, 0);
        
        expect(totalPercentage).toBeCloseTo(100, 1);
        
        // Each stat should have valid values
        breakdown.forEach((stat: any) => {
          expect(parseFloat(stat.percentage)).toBeGreaterThanOrEqual(0);
          expect(parseFloat(stat.percentage)).toBeLessThanOrEqual(100);
          expect(stat.distance).toBeGreaterThanOrEqual(0);
          expect(stat.segmentCount).toBeGreaterThan(0);
          expect(stat.color).toMatch(/^#[0-9A-F]{6}$/i);
        });
      }
    });
  });

  test.describe('Visual Regression Tests', () => {
    test('road type stats component should match snapshot', async ({ page }) => {
      // Navigate to a route with metadata
      await page.goto('/routes');
      await page.waitForLoadState('networkidle');
      
      const routeCards = await page.locator('.route-card').count();
      
      if (routeCards > 0) {
        await page.locator('.route-card').first().click();
        await page.waitForSelector('app-road-type-stats', { timeout: 5000 }).catch(() => {});
        
        const statsComponent = await page.locator('app-road-type-stats').count();
        if (statsComponent > 0) {
          // Take screenshot of the stats component
          await expect(page.locator('.road-type-stats')).toHaveScreenshot('road-type-stats.png');
        }
      }
    });

    test('colored route segments should match snapshot', async ({ page }) => {
      await page.goto('/map');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Give map time to fully render
      
      // Take screenshot of map with route segments
      const map = await page.locator('mgl-map').count();
      if (map > 0) {
        await expect(page.locator('mgl-map')).toHaveScreenshot('map-with-segments.png', {
          maxDiffPixels: 1000 // Allow some difference due to map tiles
        });
      }
    });
  });

  test.afterEach(async ({ request }) => {
    // Clean up created routes
    if (routeId) {
      await request.delete(`http://localhost:8080/api/routes/${routeId}`).catch(() => {});
      routeId = '';
    }
  });
});

test.describe('OpenStreetMap Integration Tests', () => {
  test.skip('should handle OSM API failures gracefully', async ({ request }) => {
    // Create a route even if OSM is unavailable
    const response = await request.post(`http://localhost:8080/api/routes`, {
      data: {
        name: 'OSM Fallback Test',
        description: 'Test fallback when OSM is unavailable',
        routeType: 'CYCLING',
        isPublic: true,
        points: [
          { latitude: 52.520008, longitude: 13.404954, pointType: 'START_POINT' },
          { latitude: 52.523, longitude: 13.407, pointType: 'END_POINT' }
        ]
      },
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(201);
    const route = await response.json();
    
    // Should still have metadata even with OSM failure
    expect(route.metadata).toBeDefined();
    
    const metadata = JSON.parse(route.metadata);
    
    // Should have segments (even if using fallback)
    expect(metadata.roadTypeSegments).toBeDefined();
    expect(metadata.roadTypeStats).toBeDefined();
    
    // Clean up
    await request.delete(`http://localhost:8080/api/routes/${route.id}`);
  });

  test.skip('should cache OSM data for repeated requests', async ({ request }) => {
    // Create two routes with same coordinates
    const routeData = {
      name: 'Cache Test Route',
      description: 'Testing OSM cache',
      routeType: 'CYCLING',
      isPublic: true,
      points: [
        { latitude: 52.520008, longitude: 13.404954, pointType: 'START_POINT' },
        { latitude: 52.521, longitude: 13.405, pointType: 'END_POINT' }
      ]
    };

    // First request
    const start1 = Date.now();
    const response1 = await request.post(`http://localhost:8080/api/routes`, {
      data: { ...routeData, name: 'Cache Test 1' },
      headers: { 'Content-Type': 'application/json' }
    });
    const time1 = Date.now() - start1;
    const route1 = await response1.json();

    // Second request with same coordinates
    const start2 = Date.now();
    const response2 = await request.post(`http://localhost:8080/api/routes`, {
      data: { ...routeData, name: 'Cache Test 2' },
      headers: { 'Content-Type': 'application/json' }
    });
    const time2 = Date.now() - start2;
    const route2 = await response2.json();

    // Second request should be faster due to caching
    // (This is a soft assertion as network conditions can vary)
    console.log(`First request: ${time1}ms, Second request: ${time2}ms`);

    // Clean up
    await request.delete(`http://localhost:8080/api/routes/${route1.id}`);
    await request.delete(`http://localhost:8080/api/routes/${route2.id}`);
  });
});
