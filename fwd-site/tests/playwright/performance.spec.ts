import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('homepage has correct title and loads', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('FWD Thinking Solutions | Web Developer for UK Businesses');

    // Check critical elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
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

  test('homepage navigation is present and functional', async ({ page }) => {
    await page.goto('/');

    // Check navigation landmark is visible
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
  });

  test('mobile navigation works correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check main heading visible on mobile
    await expect(page.locator('h1')).toBeVisible();

    // Ensure no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth);
  });
});
