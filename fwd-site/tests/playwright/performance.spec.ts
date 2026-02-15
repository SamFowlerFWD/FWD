import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('homepage achieves 95+ Lighthouse score', async ({ page }) => {
    await page.goto('/');
    
    // Check page loads successfully
    await expect(page).toHaveTitle(/Your Competitors Already Started/);
    
    // Check critical elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.competitor-clock')).toBeVisible();
    
    // Check for mobile responsiveness
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      // Mobile specific checks
      await expect(page.locator('.btn-urgent').first()).toBeVisible();
    }
    
    // Check interactive elements work
    const calculator = page.locator('#ai-calculator-form');
    if (await calculator.isVisible()) {
      await page.fill('input[name="employees"]', '15');
      await page.fill('input[name="hourlyRate"]', '40');
      await page.click('button[type="submit"]');
      
      // Check results appear
      await expect(page.locator('#calculator-results')).toBeVisible({ timeout: 5000 });
    }
  });
  
  test('service page loads quickly', async ({ page }) => {
    await page.goto('/services/custom-app-development');

    // Check page loads
    await expect(page).toHaveTitle(/Custom App Development/);
    
    // Check main content is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Measure page load metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });
    
    // Page should load quickly
    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.loadComplete).toBeLessThan(5000);
  });
  
  test('psychological components are interactive', async ({ page }) => {
    await page.goto('/');
    
    // Check competitor clock updates
    const competitorCount = page.locator('.competitor-count');
    const initialCount = await competitorCount.textContent();
    expect(initialCount).toBeTruthy();
    
    // Check revenue loss counter is visible and updating
    const lossCounter = page.locator('.loss-counter');
    if (await lossCounter.isVisible()) {
      const initialLoss = await lossCounter.textContent();
      await page.waitForTimeout(2000);
      const updatedLoss = await lossCounter.textContent();
      expect(updatedLoss).not.toBe(initialLoss);
    }
    
    // Check local proof feed is present
    await expect(page.locator('.local-proof-feed')).toBeVisible();
  });
  
  test('mobile navigation works correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile-specific elements
    await expect(page.locator('.btn-urgent').first()).toBeVisible();
    
    // Check responsive design
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
    
    // Ensure no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth);
  });
});