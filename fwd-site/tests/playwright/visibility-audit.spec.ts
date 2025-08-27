import { test, expect } from '@playwright/test';

test.describe('Critical Visibility Audit', () => {
  test('audit homepage visibility and functionality', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
    
    // Take full page screenshot for analysis
    await page.screenshot({ path: 'homepage-full.png', fullPage: true });
    
    // Check if critical elements are visible
    const criticalElements = {
      'Hero Headline': 'h1',
      'Competitor Clock': '[data-component="competitor-clock"]',
      'Revenue Counter': '[data-component="revenue-counter"]',
      'Calculator': '[data-component="ai-calculator"]',
      'Local Proof': '[data-component="local-proof"]',
      'CTA Button': 'button',
      'Navigation': 'nav',
      'Hero Section': 'section'
    };
    
    console.log('=== VISIBILITY AUDIT RESULTS ===');
    
    for (const [name, selector] of Object.entries(criticalElements)) {
      const element = page.locator(selector).first();
      const count = await page.locator(selector).count();
      const isVisible = count > 0 ? await element.isVisible() : false;
      
      if (isVisible) {
        const box = await element.boundingBox();
        console.log(`✅ ${name}: VISIBLE (${count} found) - Size: ${box?.width}x${box?.height}`);
        
        // Check if element has actual content
        const text = await element.textContent().catch(() => '');
        if (text && text.trim()) {
          console.log(`   Content: "${text.substring(0, 50)}..."`);
        } else {
          console.log(`   ⚠️ WARNING: No text content`);
        }
      } else {
        console.log(`❌ ${name}: NOT VISIBLE (${count} found)`);
      }
    }
    
    // Check for any error messages
    const errors = await page.locator('.error, [class*="error"]').count();
    if (errors > 0) {
      console.log(`\n⚠️ Found ${errors} error elements on page`);
    }
    
    // Check viewport coverage
    const viewport = page.viewportSize();
    const bodySize = await page.locator('body').boundingBox();
    console.log(`\n📐 Viewport: ${viewport?.width}x${viewport?.height}`);
    console.log(`📐 Body size: ${bodySize?.width}x${bodySize?.height}`);
    
    // Check for layout issues
    const overlappingElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overlaps = [];
      
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const rect1 = elements[i].getBoundingClientRect();
          const rect2 = elements[j].getBoundingClientRect();
          
          if (rect1.width > 0 && rect1.height > 0 && 
              rect2.width > 0 && rect2.height > 0) {
            const overlap = !(rect1.right < rect2.left || 
                             rect1.left > rect2.right || 
                             rect1.bottom < rect2.top || 
                             rect1.top > rect2.bottom);
            
            if (overlap && elements[i].tagName !== 'BODY' && 
                elements[j].tagName !== 'BODY' &&
                !elements[i].contains(elements[j]) && 
                !elements[j].contains(elements[i])) {
              overlaps.push({
                elem1: elements[i].tagName + '.' + elements[i].className,
                elem2: elements[j].tagName + '.' + elements[j].className
              });
            }
          }
        }
      }
      return overlaps.slice(0, 5); // Return first 5 overlaps
    });
    
    if (overlappingElements.length > 0) {
      console.log('\n⚠️ Overlapping elements detected:');
      overlappingElements.forEach(o => console.log(`   ${o.elem1} overlaps ${o.elem2}`));
    }
    
    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.complete || img.naturalHeight === 0)
                 .map(img => img.src);
    });
    
    if (brokenImages.length > 0) {
      console.log('\n❌ Broken images:', brokenImages);
    }
    
    // Check color contrast for text
    const lowContrast = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, p, span, button');
      const issues = [];
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgColor = style.backgroundColor;
        const textColor = style.color;
        
        // Simple check for very low contrast
        if (bgColor === textColor) {
          issues.push({
            tag: el.tagName,
            text: el.textContent?.substring(0, 30)
          });
        }
      });
      
      return issues;
    });
    
    if (lowContrast.length > 0) {
      console.log('\n⚠️ Potential contrast issues:', lowContrast);
    }
    
    // Check if JavaScript is working
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             document.querySelectorAll('[data-component]').length > 0;
    });
    
    console.log(`\n🔧 JavaScript: ${jsWorking ? 'Working' : 'Not working'}`);
    
    // Check actual content presence
    const hasContent = await page.evaluate(() => {
      const body = document.body.textContent || '';
      return {
        hasText: body.trim().length > 100,
        wordCount: body.split(/\s+/).length,
        hasHeadline: !!document.querySelector('h1')?.textContent,
        hasCTA: !!document.querySelector('button')?.textContent
      };
    });
    
    console.log('\n📝 Content Analysis:');
    console.log(`   Has substantial text: ${hasContent.hasText}`);
    console.log(`   Word count: ${hasContent.wordCount}`);
    console.log(`   Has headline: ${hasContent.hasHeadline}`);
    console.log(`   Has CTA: ${hasContent.hasCTA}`);
    
    // Mobile viewport test
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'homepage-mobile.png' });
    
    const mobileLayout = await page.evaluate(() => {
      const body = document.body;
      const width = body.scrollWidth;
      const viewportWidth = window.innerWidth;
      return {
        hasHorizontalScroll: width > viewportWidth,
        bodyWidth: width,
        viewportWidth: viewportWidth
      };
    });
    
    console.log('\n📱 Mobile Layout:');
    console.log(`   Horizontal scroll: ${mobileLayout.hasHorizontalScroll ? '❌ YES (BAD)' : '✅ NO'}`);
    console.log(`   Body width: ${mobileLayout.bodyWidth}px`);
    console.log(`   Viewport width: ${mobileLayout.viewportWidth}px`);
    
    // Final summary
    console.log('\n=== END AUDIT ===');
  });
  
  test('check specific psychological components', async ({ page }) => {
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
    
    // Test Competitor Clock
    const competitorClock = page.locator('[data-component="competitor-clock"]');
    if (await competitorClock.count() > 0) {
      const initialText = await competitorClock.textContent();
      await page.waitForTimeout(5000);
      const updatedText = await competitorClock.textContent();
      console.log(`Competitor Clock - Initial: "${initialText}" | After 2s: "${updatedText}"`);
      console.log(`Clock is updating: ${initialText !== updatedText}`);
    } else {
      console.log('❌ Competitor Clock not found');
    }
    
    // Test Revenue Counter
    const revenueCounter = page.locator('[data-component="revenue-counter"]');
    if (await revenueCounter.count() > 0) {
      const initialValue = await revenueCounter.textContent();
      await page.waitForTimeout(5000);
      const updatedValue = await revenueCounter.textContent();
      console.log(`Revenue Counter - Initial: "${initialValue}" | After 2s: "${updatedValue}"`);
      console.log(`Counter is updating: ${initialValue !== updatedValue}`);
    } else {
      console.log('❌ Revenue Counter not found');
    }
    
    // Test Calculator
    const calculator = page.locator('[data-component="ai-calculator"]');
    if (await calculator.count() > 0) {
      const inputs = await calculator.locator('input').count();
      const buttons = await calculator.locator('button').count();
      console.log(`Calculator - Inputs: ${inputs}, Buttons: ${buttons}`);
    } else {
      console.log('❌ AI Calculator not found');
    }
  });
});