import { test, expect } from '@playwright/test';

test.describe('Debug Live Metadata', () => {
  test('check if route calculates and shows metadata', async ({ page }) => {
    // Navigate to the map page
    await page.goto('http://localhost:4200/map');
    
    // Wait for the map to load
    await page.waitForSelector('.maplibregl-map', { timeout: 10000 });
    
    // Use the add location input instead of clicking on map
    const locationInput = page.locator('input[placeholder="Add location..."]');
    
    // Add first waypoint
    await locationInput.fill('Berlin, Germany');
    await locationInput.press('Enter');
    await page.waitForTimeout(2000);
    
    // Add second waypoint
    await locationInput.fill('Potsdam, Germany');
    await locationInput.press('Enter');
    await page.waitForTimeout(3000); // Wait for route calculation
    
    // Check if route summary appears
    const routeSummary = page.locator('.bg-light.rounded.p-3');
    const summaryVisible = await routeSummary.isVisible();
    console.log('Route summary visible:', summaryVisible);
    
    // Check if road type statistics are visible
    const roadTypeStats = page.locator('app-road-type-stats');
    const statsVisible = await roadTypeStats.isVisible();
    console.log('Road type stats visible:', statsVisible);
    
    // Check what's in the sidepanel
    const sidepanel = page.locator('app-sidepanel');
    const sidepanelContent = await sidepanel.textContent();
    console.log('Sidepanel contains:', sidepanelContent?.substring(0, 200));
    
    // Check if displayMetadata getter is working
    const metadataSection = page.locator('[class*="mb-3"]').filter({ has: page.locator('app-road-type-stats') });
    const metadataVisible = await metadataSection.isVisible();
    console.log('Metadata section visible:', metadataVisible);
    
    if (statsVisible) {
      const statsContent = await roadTypeStats.textContent();
      console.log('Road type stats content:', statsContent);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/live-metadata-debug.png', fullPage: true });
    
    expect(summaryVisible || statsVisible).toBeTruthy();
  });
});
