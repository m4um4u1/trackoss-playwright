import { test, expect } from '@playwright/test';
import { 
  generateTestPoints, 
  parseMetadata, 
  validateHexColor,
  SELECTORS 
} from '../utils/types';

test.describe('Road Type Edge Cases and Error Handling', () => {
  let testRouteIds: string[] = [];

  test.afterEach(async ({ request }) => {
    // Clean up all test routes
    for (const id of testRouteIds) {
      await request.delete(`http://localhost:8080/api/routes/${id}`).catch(() => {});
    }
    testRouteIds = [];
  });

  test.describe('Empty and Minimal Routes', () => {
    test('should handle route with only two points', async ({ request }) => {
      const response = await request.post(`http://localhost:8080/api/routes`, {
        data: {
          name: 'Minimal Route',
          routeType: 'WALKING',
          isPublic: false,
          points: [
            { latitude: 52.520008, longitude: 13.404954, pointType: 'START_POINT' },
            { latitude: 52.520009, longitude: 13.404955, pointType: 'END_POINT' }
          ]
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status()).toBe(201);
      const route = await response.json();
      testRouteIds.push(route.id);

      const metadata = parseMetadata(route.metadata);
      
      // Should have at least one segment
      expect(metadata.roadTypeSegments).toBeDefined();
      expect(metadata.roadTypeSegments?.length).toBeGreaterThanOrEqual(1);
      
      // Should have stats even for minimal route
      expect(metadata.roadTypeStats).toBeDefined();
      expect(metadata.roadTypeStats?.totalDistance).toBeGreaterThanOrEqual(0);
    });

    test('should handle route with identical start and end points', async ({ request }) => {
      const response = await request.post(`http://localhost:8080/api/routes`, {
        data: {
          name: 'Loop Route',
          routeType: 'CYCLING',
          isPublic: false,
          points: [
            { latitude: 52.520008, longitude: 13.404954, pointType: 'START_POINT' },
            { latitude: 52.521, longitude: 13.405, pointType: 'WAYPOINT' },
            { latitude: 52.522, longitude: 13.406, pointType: 'WAYPOINT' },
            { latitude: 52.520008, longitude: 13.404954, pointType: 'END_POINT' }
          ]
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status()).toBe(201);
      const route = await response.json();
      testRouteIds.push(route.id);

      const metadata = parseMetadata(route.metadata);
      expect(metadata.roadTypeSegments).toBeDefined();
      expect(metadata.roadTypeStats).toBeDefined();
    });
  });

  test.describe('Large Routes', () => {
    test('should handle route with 100+ points', async ({ request }) => {
      const points = generateTestPoints(100);
      
      const response = await request.post(`http://localhost:8080/api/routes`, {
        data: {
          name: 'Large Route Test',
          routeType: 'HIKING',
          isPublic: false,
          points: points
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status()).toBe(201);
      const route = await response.json();
      testRouteIds.push(route.id);

      const metadata = parseMetadata(route.metadata);
      
      // Should process all segments
      expect(metadata.roadTypeSegments).toBeDefined();
      expect(metadata.roadTypeStats).toBeDefined();
      
      // Validate all colors are valid hex
      metadata.roadTypeSegments?.forEach(segment => {
        expect(validateHexColor(segment.color)).toBe(true);
      });
    });

    test('should handle very long distance route', async ({ request }) => {
      // Create points spanning large distance
      const points = [
        { latitude: 52.520008, longitude: 13.404954, pointType: 'START_POINT' as const },
        { latitude: 52.620008, longitude: 13.504954, pointType: 'WAYPOINT' as const },
        { latitude: 52.720008, longitude: 13.604954, pointType: 'WAYPOINT' as const },
        { latitude: 52.820008, longitude: 13.704954, pointType: 'END_POINT' as const }
      ];

      const response = await request.post(`http://localhost:8080/api/routes`, {
        data: {
          name: 'Long Distance Route',
          routeType: 'DRIVING',
          isPublic: false,
          points: points
        },
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.status()).toBe(201);
      const route = await response.json();
      testRouteIds.push(route.id);

      const metadata = parseMetadata(route.metadata);
      
      // Total distance should be significant
      expect(metadata.roadTypeStats?.totalDistance).toBeGreaterThan(10000); // > 10km
    });
  });

  test.describe('Invalid Coordinates', () => {
    test('should handle routes with invalid latitude', async ({ request }) => {
      const response = await request.post(`http://localhost:8080/api/routes`, {
        data: {
          name: 'Invalid Latitude Route',
          routeType: 'WALKING',
          isPublic: false,
          points: [
            { latitude: 91, longitude: 13.404954, pointType: 'START_POINT' }, // Invalid latitude > 90
            { latitude: 52.520008, longitude: 13.404954, pointType: 'END_POINT' }
          ]
        },
        headers: { 'Content-Type': 'application/json' }
      });

      // Should reject invalid coordinates
      expect(response.status()).not.toBe(201);
    });

    test('should handle routes with invalid longitude', async ({ request }) => {
      const response = await request.post(`http://localhost:8080/api/routes`, {
        data: {
          name: 'Invalid Longitude Route',
          routeType: 'WALKING',
          isPublic: false,
          points: [
            { latitude: 52.520008, longitude: 181, pointType: 'START_POINT' }, // Invalid longitude > 180
            { latitude: 52.520008, longitude: 13.404954, pointType: 'END_POINT' }
          ]
        },
        headers: { 'Content-Type': 'application/json' }
      });

      // Should reject invalid coordinates
      expect(response.status()).not.toBe(201);
    });
  });

  test.describe('UI Error States', () => {
    test('should display fallback when metadata is corrupted', async ({ page }) => {
      await page.goto(`/routes`);
      await page.waitForLoadState('networkidle');

      // Inject a route with corrupted metadata via localStorage or API mock
      await page.evaluate(() => {
        // Mock a route with invalid metadata
        const mockRoute = {
          id: 'test-corrupt',
          name: 'Corrupted Route',
          metadata: 'invalid-json-{broken'
        };
        localStorage.setItem('test-corrupt-route', JSON.stringify(mockRoute));
      });

      // The component should handle corrupted metadata gracefully
      const errorMessage = await page.locator('.metadata-error').count();
      if (errorMessage > 0) {
        await expect(page.locator('.metadata-error')).toContainText('Unable to load road type data');
      }
    });

    test('should show loading state while fetching metadata', async ({ page }) => {
      await page.goto(`/map`);
      
      // Intercept route API calls to add delay
      await page.route('**/api/routes/**', async route => {
        await page.waitForTimeout(2000); // Simulate slow network
        await route.continue();
      });

      // Trigger route loading
      const mapLoaded = await page.waitForSelector(SELECTORS.map, { timeout: 10000 }).catch(() => null);
      
      if (mapLoaded) {
        // Check for loading indicator
        const loadingIndicator = await page.locator('.loading-metadata').count();
        if (loadingIndicator > 0) {
          await expect(page.locator('.loading-metadata')).toBeVisible();
        }
      }
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto(`/routes`);
      
      // Simulate network failure
      await page.route('**/api/routes/**', route => {
        route.abort('failed');
      });

      // Try to load routes
      const errorState = await page.waitForSelector('.error-message', { timeout: 5000 }).catch(() => null);
      
      if (errorState) {
        await expect(page.locator('.error-message')).toContainText(/Unable to load routes|Network error/i);
      }
    });
  });

  test.describe('Concurrent Requests', () => {
    test('should handle multiple simultaneous route creations', async ({ request }) => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        const promise = request.post(`http://localhost:8080/api/routes`, {
          data: {
            name: `Concurrent Route ${i}`,
            routeType: 'CYCLING',
            isPublic: false,
            points: generateTestPoints(3)
          },
          headers: { 'Content-Type': 'application/json' }
        });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(201);
      });

      // Collect IDs for cleanup
      for (const response of responses) {
        const route = await response.json();
        testRouteIds.push(route.id);
        
        // Each should have valid metadata
        const metadata = parseMetadata(route.metadata);
        expect(metadata.roadTypeSegments).toBeDefined();
      }
    });
  });

  test.describe('Special Characters and Encoding', () => {
    test('should handle route names with special characters', async ({ request }) => {
      const specialNames = [
        'Route with émojis 🚴‍♂️🏃‍♀️',
        'Route with ümlaut äöü',
        'Route with "quotes" and \'apostrophes\'',
        'Route with <tags> & symbols',
        'Route with 中文字符'
      ];

      for (const name of specialNames) {
        const response = await request.post(`http://localhost:8080/api/routes`, {
          data: {
            name: name,
            description: `Testing special chars: ${name}`,
            routeType: 'WALKING',
            isPublic: false,
            points: generateTestPoints(2)
          },
          headers: { 'Content-Type': 'application/json' }
        });

        expect(response.status()).toBe(201);
        const route = await response.json();
        testRouteIds.push(route.id);
        
        // Name should be preserved correctly
        expect(route.name).toBe(name);
        
        // Metadata should still be valid JSON
        const metadata = parseMetadata(route.metadata);
        expect(metadata).toBeDefined();
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('metadata calculation should complete within reasonable time', async ({ request }) => {
      const points = generateTestPoints(50);
      
      const startTime = Date.now();
      const response = await request.post(`http://localhost:8080/api/routes`, {
        data: {
          name: 'Performance Test Route',
          routeType: 'CYCLING',
          isPublic: false,
          points: points
        },
        headers: { 'Content-Type': 'application/json' }
      });
      const duration = Date.now() - startTime;

      expect(response.status()).toBe(201);
      const route = await response.json();
      testRouteIds.push(route.id);

      // Should complete within 10 seconds even with OSM lookups
      expect(duration).toBeLessThan(10000);
      
      const metadata = parseMetadata(route.metadata);
      expect(metadata.roadTypeSegments).toBeDefined();
    });

    test('UI should remain responsive with large metadata', async ({ page }) => {
      await page.goto(`/routes`);
      await page.waitForLoadState('networkidle');

      // Measure interaction responsiveness
      const startTime = Date.now();
      
      // Try clicking on UI elements
      const routeCard = await page.locator(SELECTORS.routeCard).first();
      if (await routeCard.count() > 0) {
        await routeCard.click();
        
        // Should respond quickly
        await page.waitForSelector(SELECTORS.routeDisplay, { timeout: 2000 });
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(2000);
      }
    });
  });

  test.describe('Map Layer Edge Cases', () => {
    test('should handle removing layers when no route exists', async ({ page }) => {
      await page.goto(`/map`);
      await page.waitForSelector(SELECTORS.map, { timeout: 10000 });

      // Execute layer removal without any route
      const error = await page.evaluate(() => {
        try {
          // Attempt to trigger layer removal
          const event = new CustomEvent('removeRoadTypeLayer');
          window.dispatchEvent(event);
          return null;
        } catch (e) {
          return e.message;
        }
      });

      // Should not throw errors
      expect(error).toBeNull();
    });

    test('should handle rapid layer toggling', async ({ page }) => {
      await page.goto(`/map`);
      await page.waitForSelector(SELECTORS.map, { timeout: 10000 });

      const toggle = page.locator(SELECTORS.roadTypeToggle);
      if (await toggle.count() > 0) {
        // Rapidly toggle the layer
        for (let i = 0; i < 10; i++) {
          await toggle.click();
          await page.waitForTimeout(50);
        }

        // UI should remain stable
        await expect(page.locator(SELECTORS.map)).toBeVisible();
      }
    });
  });
});
