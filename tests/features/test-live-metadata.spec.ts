import { test, expect } from '@playwright/test';

test.describe('Live Route Metadata Display', () => {
  test('should show route type statistics immediately when creating a route', async ({ page }) => {
    // Navigate to the map page
    await page.goto('http://localhost:4200/map');
    
    // Wait for the map to load
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    
    // Click on the map to add waypoints
    const mapElement = page.locator('.maplibregl-map');
    
    // Add first waypoint
    await mapElement.click({ position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    
    // Add second waypoint to create a route
    await mapElement.click({ position: { x: 500, y: 400 } });
    await page.waitForTimeout(1000);
    
    // Check if route summary appears
    const routeSummary = page.locator('.bg-light.rounded.p-3');
    await expect(routeSummary).toBeVisible({ timeout: 5000 });
    
    // Check if road type statistics are visible
    const roadTypeStats = page.locator('app-road-type-stats');
    await expect(roadTypeStats).toBeVisible({ timeout: 5000 });
    
    // Verify that the statistics contain road type information
    const statsContent = roadTypeStats.locator('.stats-container');
    await expect(statsContent).toBeVisible();
    
    // Check for specific road type entries (based on our estimated data)
    const roadTypeEntries = statsContent.locator('.stat-item');
    const count = await roadTypeEntries.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify at least one road type is displayed
    const firstRoadType = roadTypeEntries.first();
    await expect(firstRoadType).toContainText(/BIKE_PATH|PAVED_ROAD|RESIDENTIAL|TRAIL|SHARED_USE_PATH|PEDESTRIAN_ONLY/);
    
    // Test clearing route removes metadata
    const clearButton = page.locator('button[title="Clear all"]');
    await clearButton.click();
    
    // Verify road type stats are no longer visible after clearing
    await expect(roadTypeStats).not.toBeVisible();
    
    console.log('✅ Live route metadata displays correctly during route creation');
  });
  
  test('should update metadata when switching between bicycle and hiking modes', async ({ page }) => {
    // Navigate to the map page
    await page.goto('http://localhost:4200/map');
    
    // Wait for the map to load
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    
    // Add waypoints to create a route
    const mapElement = page.locator('.maplibregl-map');
    await mapElement.click({ position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    await mapElement.click({ position: { x: 500, y: 400 } });
    await page.waitForTimeout(1000);
    
    // Check initial metadata for bicycle mode
    const roadTypeStats = page.locator('app-road-type-stats');
    await expect(roadTypeStats).toBeVisible({ timeout: 5000 });
    
    // Get initial road type content
    const initialContent = await roadTypeStats.locator('.stats-container').textContent();
    expect(initialContent).toContain('BIKE_PATH');
    
    // Switch to hiking mode
    const modeSelect = page.locator('select').filter({ hasText: 'Bicycle' }).first();
    await modeSelect.selectOption('pedestrian');
    await page.waitForTimeout(2000); // Wait for route recalculation
    
    // Check if metadata updated for hiking mode
    const updatedContent = await roadTypeStats.locator('.stats-container').textContent();
    expect(updatedContent).toContain('TRAIL');
    
    console.log('✅ Metadata updates correctly when switching transportation modes');
  });
});
