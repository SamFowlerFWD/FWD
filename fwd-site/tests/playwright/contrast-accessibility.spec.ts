import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG contrast ratios
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;
const WCAG_AAA_NORMAL = 7.0;
const WCAG_AAA_LARGE = 4.5;

// Helper function to calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Helper function to parse RGB color
function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return null;
}

// Calculate contrast ratio between two colors
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseRgb(color1);
  const rgb2 = parseRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe('Comprehensive Contrast and Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
  });

  test('WCAG AA/AAA Contrast Compliance Check', async ({ page }) => {
    console.log('\n=== CONTRAST RATIO AUDIT ===\n');
    
    const contrastIssues = await page.evaluate(() => {
      const issues: Array<{
        selector: string;
        text: string;
        color: string;
        background: string;
        fontSize: string;
        fontWeight: string;
        ratio?: number;
        required?: number;
        passes?: boolean;
      }> = [];
      
      // Select all text elements
      const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, td, th, div[class*="text"], div[class*="badge"], [class*="headline"]');
      
      elements.forEach(element => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;
        
        // Skip invisible elements
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return;
        }
        
        // Find actual background color (traverse up the DOM tree)
        let bgElement = element as HTMLElement;
        let backgroundColor = style.backgroundColor;
        
        while (backgroundColor === 'rgba(0, 0, 0, 0)' && bgElement.parentElement) {
          bgElement = bgElement.parentElement;
          backgroundColor = window.getComputedStyle(bgElement).backgroundColor;
        }
        
        // Default to white if no background found
        if (backgroundColor === 'rgba(0, 0, 0, 0)') {
          backgroundColor = 'rgb(255, 255, 255)';
        }
        
        const text = (element.textContent || '').trim().substring(0, 50);
        if (!text) return;
        
        // Determine if text is "large" (14pt bold or 18pt regular)
        const isLarge = (fontSize >= 18) || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        
        issues.push({
          selector: element.tagName.toLowerCase() + (element.className ? '.' + element.className.split(' ')[0] : ''),
          text: text,
          color: color,
          background: backgroundColor,
          fontSize: fontSize + 'px',
          fontWeight: fontWeight,
          required: isLarge ? 3.0 : 4.5
        });
      });
      
      return issues;
    });
    
    // Calculate contrast ratios and identify failures
    const failures: typeof contrastIssues = [];
    const warnings: typeof contrastIssues = [];
    const passes: typeof contrastIssues = [];
    
    for (const issue of contrastIssues) {
      const ratio = getContrastRatio(issue.color, issue.background);
      issue.ratio = Math.round(ratio * 100) / 100;
      issue.passes = ratio >= (issue.required || 4.5);
      
      if (!issue.passes) {
        if (ratio < 3.0) {
          failures.push(issue);
        } else {
          warnings.push(issue);
        }
      } else if (ratio >= 7.0) {
        passes.push(issue);
      }
    }
    
    // Report critical failures (contrast < 3.0)
    if (failures.length > 0) {
      console.log('❌ CRITICAL CONTRAST FAILURES (ratio < 3.0):');
      failures.forEach(f => {
        console.log(`   ${f.selector}: "${f.text}"`);
        console.log(`     Color: ${f.color} on ${f.background}`);
        console.log(`     Ratio: ${f.ratio}:1 (Required: ${f.required}:1)`);
        console.log(`     Font: ${f.fontSize} ${f.fontWeight}\n`);
      });
    }
    
    // Report warnings (3.0 <= ratio < required)
    if (warnings.length > 0) {
      console.log('⚠️  WCAG AA FAILURES (ratio below required):');
      warnings.forEach(w => {
        console.log(`   ${w.selector}: "${w.text}"`);
        console.log(`     Color: ${w.color} on ${w.background}`);
        console.log(`     Ratio: ${w.ratio}:1 (Required: ${w.required}:1)`);
        console.log(`     Font: ${w.fontSize} ${w.fontWeight}\n`);
      });
    }
    
    // Summary statistics
    console.log('\n📊 CONTRAST SUMMARY:');
    console.log(`   Total elements tested: ${contrastIssues.length}`);
    console.log(`   Critical failures: ${failures.length}`);
    console.log(`   WCAG AA failures: ${warnings.length}`);
    console.log(`   AAA compliant (ratio >= 7.0): ${passes.length}`);
    
    // Take screenshots of problem areas
    if (failures.length > 0) {
      await page.screenshot({ 
        path: 'contrast-failures.png', 
        fullPage: true 
      });
      console.log('\n📸 Screenshot saved: contrast-failures.png');
    }
    
    // Assert no critical failures
    expect(failures.length).toBe(0);
  });

  test('Axe-core Accessibility Scan', async ({ page }) => {
    console.log('\n=== AXE-CORE ACCESSIBILITY SCAN ===\n');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Group violations by impact
    const critical = accessibilityScanResults.violations.filter(v => v.impact === 'critical');
    const serious = accessibilityScanResults.violations.filter(v => v.impact === 'serious');
    const moderate = accessibilityScanResults.violations.filter(v => v.impact === 'moderate');
    const minor = accessibilityScanResults.violations.filter(v => v.impact === 'minor');
    
    if (critical.length > 0) {
      console.log('🔴 CRITICAL VIOLATIONS:');
      critical.forEach(v => {
        console.log(`   ${v.id}: ${v.description}`);
        console.log(`   Help: ${v.helpUrl}`);
        console.log(`   Affected elements: ${v.nodes.length}`);
        v.nodes.slice(0, 3).forEach(n => {
          console.log(`     - ${n.target.join(' ')}`);
        });
        console.log('');
      });
    }
    
    if (serious.length > 0) {
      console.log('🟠 SERIOUS VIOLATIONS:');
      serious.forEach(v => {
        console.log(`   ${v.id}: ${v.description}`);
        console.log(`   Affected elements: ${v.nodes.length}`);
        console.log('');
      });
    }
    
    if (moderate.length > 0) {
      console.log('🟡 MODERATE VIOLATIONS:');
      moderate.forEach(v => {
        console.log(`   ${v.id}: ${v.description}`);
        console.log(`   Affected elements: ${v.nodes.length}`);
        console.log('');
      });
    }
    
    console.log('📊 ACCESSIBILITY SUMMARY:');
    console.log(`   Critical: ${critical.length}`);
    console.log(`   Serious: ${serious.length}`);
    console.log(`   Moderate: ${moderate.length}`);
    console.log(`   Minor: ${minor.length}`);
    console.log(`   Total violations: ${accessibilityScanResults.violations.length}`);
    
    // Assert no critical or serious violations
    expect(critical.length + serious.length).toBe(0);
  });

  test('Interactive Elements Visibility and Contrast', async ({ page }) => {
    console.log('\n=== INTERACTIVE ELEMENTS AUDIT ===\n');
    
    const interactiveAudit = await page.evaluate(() => {
      const results: Array<{
        type: string;
        text: string;
        visible: boolean;
        focusable: boolean;
        hasLabel: boolean;
        color?: string;
        background?: string;
        hoverColor?: string;
        focusOutline?: string;
      }> = [];
      
      // Check all interactive elements
      const selectors = ['button', 'a', 'input', 'select', 'textarea', '[role="button"]', '[onclick]'];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          const style = window.getComputedStyle(htmlEl);
          const rect = htmlEl.getBoundingClientRect();
          
          results.push({
            type: el.tagName.toLowerCase(),
            text: (htmlEl.textContent || htmlEl.getAttribute('aria-label') || htmlEl.getAttribute('placeholder') || '').trim().substring(0, 30),
            visible: rect.width > 0 && rect.height > 0 && style.opacity !== '0',
            focusable: htmlEl.tabIndex >= 0,
            hasLabel: !!(htmlEl.textContent || htmlEl.getAttribute('aria-label')),
            color: style.color,
            background: style.backgroundColor,
            focusOutline: style.outlineStyle
          });
        });
      });
      
      return results;
    });
    
    const invisibleElements = interactiveAudit.filter(e => !e.visible);
    const unlabeledElements = interactiveAudit.filter(e => !e.hasLabel && e.visible);
    const nonFocusable = interactiveAudit.filter(e => !e.focusable && e.visible);
    
    if (invisibleElements.length > 0) {
      console.log('👻 INVISIBLE INTERACTIVE ELEMENTS:');
      invisibleElements.forEach(e => {
        console.log(`   ${e.type}: "${e.text || 'no text'}"`);
      });
    }
    
    if (unlabeledElements.length > 0) {
      console.log('\n🏷️  UNLABELED INTERACTIVE ELEMENTS:');
      unlabeledElements.forEach(e => {
        console.log(`   ${e.type}`);
      });
    }
    
    if (nonFocusable.length > 0) {
      console.log('\n⌨️  NON-FOCUSABLE INTERACTIVE ELEMENTS:');
      nonFocusable.forEach(e => {
        console.log(`   ${e.type}: "${e.text}"`);
      });
    }
    
    console.log('\n📊 INTERACTIVE ELEMENTS SUMMARY:');
    console.log(`   Total interactive elements: ${interactiveAudit.length}`);
    console.log(`   Visible: ${interactiveAudit.filter(e => e.visible).length}`);
    console.log(`   Invisible: ${invisibleElements.length}`);
    console.log(`   Unlabeled: ${unlabeledElements.length}`);
    console.log(`   Non-focusable: ${nonFocusable.length}`);
  });

  test('Focus States and Keyboard Navigation', async ({ page }) => {
    console.log('\n=== FOCUS STATES AUDIT ===\n');
    
    // Test tab navigation
    const tabSequence: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().substring(0, 30),
          hasOutline: window.getComputedStyle(el).outlineStyle !== 'none',
          outlineColor: window.getComputedStyle(el).outlineColor,
          outlineWidth: window.getComputedStyle(el).outlineWidth
        };
      });
      
      if (focusedElement) {
        tabSequence.push(`${focusedElement.tag}: "${focusedElement.text}" - Outline: ${focusedElement.hasOutline ? '✅' : '❌'}`);
      }
    }
    
    console.log('🔄 TAB SEQUENCE:');
    tabSequence.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item}`);
    });
    
    // Check for focus trap
    const hasFocusTrap = tabSequence.length > 0 && tabSequence[0] === tabSequence[tabSequence.length - 1];
    console.log(`\n🔒 Focus trap detected: ${hasFocusTrap ? 'YES ⚠️' : 'NO ✅'}`);
  });

  test('Mobile Viewport Contrast Check', async ({ page }) => {
    console.log('\n=== MOBILE VIEWPORT CONTRAST ===\n');
    
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000); // Wait for responsive adjustments
    
    const mobileContrast = await page.evaluate(() => {
      const issues: Array<{ element: string; issue: string }> = [];
      
      // Check if any text becomes unreadable on mobile
      const textElements = document.querySelectorAll('h1, h2, h3, p, button');
      
      textElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Check if text is cut off
        if (rect.right > window.innerWidth) {
          issues.push({
            element: el.tagName.toLowerCase(),
            issue: 'Text extends beyond viewport'
          });
        }
        
        // Check if font size is too small
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 12) {
          issues.push({
            element: el.tagName.toLowerCase(),
            issue: `Font size too small: ${fontSize}px`
          });
        }
      });
      
      return issues;
    });
    
    if (mobileContrast.length > 0) {
      console.log('📱 MOBILE ISSUES:');
      mobileContrast.forEach(issue => {
        console.log(`   ${issue.element}: ${issue.issue}`);
      });
    } else {
      console.log('✅ No mobile-specific contrast issues detected');
    }
    
    await page.screenshot({ path: 'mobile-contrast.png', fullPage: true });
    console.log('📸 Mobile screenshot saved: mobile-contrast.png');
  });

  test('Generate Contrast Fix Recommendations', async ({ page }) => {
    console.log('\n=== RECOMMENDED FIXES ===\n');
    
    const recommendations = await page.evaluate(() => {
      const fixes: Array<{ selector: string; current: string; recommended: string; css: string }> = [];
      
      // Analyze problem areas and suggest fixes
      const problemSelectors = [
        { selector: '.text-gray-300', recommended: '#4B5563', css: 'color: #4B5563; /* gray-600 */' },
        { selector: '.text-gray-400', recommended: '#374151', css: 'color: #374151; /* gray-700 */' },
        { selector: '.text-gray-500', recommended: '#1F2937', css: 'color: #1F2937; /* gray-800 */' },
        { selector: '.text-gray-200', recommended: '#6B7280', css: 'color: #6B7280; /* gray-500 */' },
        { selector: '.text-urgent-amber', recommended: '#92400E', css: 'color: #92400E; /* amber-800 */' },
        { selector: '.text-orange-500', recommended: '#C2410C', css: 'color: #C2410C; /* orange-700 */' },
        { selector: 'p.text-xl.text-gray-300', recommended: '#E5E7EB', css: 'color: #E5E7EB; /* gray-200 on dark bg */' }
      ];
      
      problemSelectors.forEach(problem => {
        const elements = document.querySelectorAll(problem.selector);
        if (elements.length > 0) {
          const style = window.getComputedStyle(elements[0]);
          fixes.push({
            selector: problem.selector,
            current: style.color,
            recommended: problem.recommended,
            css: problem.css
          });
        }
      });
      
      return fixes;
    });
    
    console.log('🔧 CSS FIXES TO APPLY:\n');
    recommendations.forEach(fix => {
      console.log(`/* Fix for ${fix.selector} */`);
      console.log(`${fix.selector} {`);
      console.log(`  ${fix.css}`);
      console.log(`}\n`);
    });
    
    console.log('📝 IMPLEMENTATION NOTES:');
    console.log('1. Update global.css with better default contrast values');
    console.log('2. Replace light gray text colors with darker alternatives');
    console.log('3. Ensure all CTAs have sufficient contrast');
    console.log('4. Test focus states for all interactive elements');
    console.log('5. Verify changes across all breakpoints');
  });
});

test.describe('Performance Impact of Contrast Fixes', () => {
  test('measure rendering performance', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint');
      return {
        firstPaint: paint.find(p => p.name === 'first-paint'),
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')
      };
    });
    
    console.log('\n⚡ PERFORMANCE METRICS:');
    console.log(`   First Paint: ${metrics.firstPaint?.startTime.toFixed(2)}ms`);
    console.log(`   First Contentful Paint: ${metrics.firstContentfulPaint?.startTime.toFixed(2)}ms`);
  });
});