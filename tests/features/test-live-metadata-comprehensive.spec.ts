import { test, expect } from '@playwright/test';

test.describe('Live Route Metadata - Comprehensive Tests', () => {
  test('displays metadata immediately when creating route and clears on route clear', async ({ page }) => {
    // Navigate to the map page
    await page.goto('http://localhost:4200/map');
    
    // Wait for the map to load
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    
    // Use the add location input
    const locationInput = page.locator('input[placeholder="Add location..."]');
    
    // Add first waypoint
    await locationInput.fill('Berlin, Germany');
    await locationInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Verify no metadata shown with only one waypoint
    let roadTypeStats = page.locator('app-road-type-stats');
    await expect(roadTypeStats).not.toBeVisible();
    
    // Add second waypoint to trigger route calculation
    await locationInput.fill('Potsdam, Germany');
    await locationInput.press('Enter');
    await page.waitForTimeout(3000); // Wait for route calculation
    
    // Verify route summary appears
    const routeSummary = page.locator('.bg-light.rounded.p-3');
    await expect(routeSummary).toBeVisible();
    
    // Verify road type statistics are visible
    await expect(roadTypeStats).toBeVisible();
    
    // Verify the statistics contain the expected road types
    const statsContent = await roadTypeStats.textContent();
    expect(statsContent).toContain('Road Type Breakdown');
    expect(statsContent).toMatch(/Bike Path|Paved Road|Residential/);
    expect(statsContent).toMatch(/\d+\.\d+%/); // Check for percentage
    expect(statsContent).toMatch(/\d+\.\d+ km/); // Check for distance
    
    // Add a third waypoint
    await locationInput.fill('Brandenburg, Germany');
    await locationInput.press('Enter');
    await page.waitForTimeout(3000);
    
    // Verify metadata still visible and updated
    await expect(roadTypeStats).toBeVisible();
    
    // Test clearing the route
    const clearButton = page.locator('button[title="Clear all"]');
    await clearButton.click();
    
    // Verify road type stats are no longer visible after clearing
    await expect(roadTypeStats).not.toBeVisible();
    
    // Verify route summary is also gone
    await expect(routeSummary).not.toBeVisible();
    
    console.log('✅ Live route metadata displays and clears correctly');
  });

  test('updates metadata when changing transportation mode', async ({ page }) => {
    // Navigate to the map page
    await page.goto('http://localhost:4200/map');
    
    // Wait for the map to load
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    
    // Add waypoints to create a route
    const locationInput = page.locator('input[placeholder="Add location..."]');
    await locationInput.fill('Munich, Germany');
    await locationInput.press('Enter');
    await page.waitForTimeout(2000);
    
    await locationInput.fill('Augsburg, Germany');
    await locationInput.press('Enter');
    await page.waitForTimeout(3000);
    
    // Verify initial metadata for bicycle mode
    const roadTypeStats = page.locator('app-road-type-stats');
    await expect(roadTypeStats).toBeVisible();
    
    let statsContent = await roadTypeStats.textContent();
    console.log('Bicycle mode stats:', statsContent);
    expect(statsContent).toMatch(/Bike Path|Paved Road|Residential/);
    
    // Switch to hiking mode
    const modeSelect = page.locator('select').first();
    await modeSelect.selectOption('pedestrian');
    await page.waitForTimeout(3000); // Wait for route recalculation
    
    // Verify metadata updated for hiking mode
    await expect(roadTypeStats).toBeVisible();
    statsContent = await roadTypeStats.textContent();
    console.log('Hiking mode stats:', statsContent);
    expect(statsContent).toMatch(/Trail|Shared Use Path|Pedestrian Only/);
    
    // Switch back to bicycle mode
    await modeSelect.selectOption('bicycle');
    await page.waitForTimeout(3000);
    
    // Verify metadata reverted to bicycle types
    statsContent = await roadTypeStats.textContent();
    expect(statsContent).toMatch(/Bike Path|Paved Road|Residential/);
    
    console.log('✅ Metadata updates correctly when switching transportation modes');
  });

  test('shows consistent percentages that add up to 100%', async ({ page }) => {
    // Navigate to the map page
    await page.goto('http://localhost:4200/map');
    
    // Wait for the map to load
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    
    // Add waypoints
    const locationInput = page.locator('input[placeholder="Add location..."]');
    await locationInput.fill('Hamburg, Germany');
    await locationInput.press('Enter');
    await page.waitForTimeout(2000);
    
    await locationInput.fill('Bremen, Germany');
    await locationInput.press('Enter');
    await page.waitForTimeout(3000);
    
    // Get the road type stats
    const roadTypeStats = page.locator('app-road-type-stats');
    await expect(roadTypeStats).toBeVisible();
    
    // Get just the breakdown section (not the summary)
    const breakdownSection = roadTypeStats.locator('.stat-item');
    const items = await breakdownSection.all();
    
    // Extract percentages from each stat item
    const percentages: number[] = [];
    for (const item of items) {
      const itemText = await item.textContent();
      const match = itemText?.match(/(\d+\.\d+)%/);
      if (match) {
        percentages.push(parseFloat(match[1]));
      }
    }
    
    // Verify percentages add up to 100 (allowing small rounding errors)
    const total = percentages.reduce((sum, p) => sum + p, 0);
    console.log(`Percentages found: ${percentages.join(', ')}`);
    console.log(`Total: ${total}%`);
    
    expect(total).toBeGreaterThan(99.9);
    expect(total).toBeLessThan(100.1);
    
    console.log('✅ Percentages correctly add up to 100%');
  });
});
