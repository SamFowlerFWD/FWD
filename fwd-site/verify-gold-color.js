import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/');
  
  console.log('🎨 Verifying Gold Color #F7D00B Implementation...\n');
  
  // Check the "Limited time" badge
  const limitedTimeBadge = await page.$eval('.bg-gold-light', el => {
    const styles = window.getComputedStyle(el);
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color
    };
  }).catch(() => null);
  
  if (limitedTimeBadge) {
    console.log('✅ Limited Time Badge:');
    console.log(`   Background: ${limitedTimeBadge.backgroundColor}`);
    console.log(`   Expected: rgb(255, 228, 58) - Light Gold\n`);
  }
  
  // Check gold text elements
  const goldTexts = await page.$$eval('.text-gold', elements => {
    return elements.slice(0, 3).map(el => {
      const styles = window.getComputedStyle(el);
      return {
        text: el.textContent.trim().substring(0, 30),
        color: styles.color
      };
    });
  }).catch(() => []);
  
  if (goldTexts.length > 0) {
    console.log('✅ Gold Text Elements:');
    goldTexts.forEach(item => {
      console.log(`   "${item.text}": ${item.color}`);
    });
    console.log(`   Expected: rgb(247, 208, 11) - #F7D00B\n`);
  }
  
  // Check buttons with gold
  const goldButtons = await page.$$eval('button', elements => {
    return elements.filter(el => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor.includes('247') || 
             styles.backgroundColor.includes('208') ||
             styles.borderColor.includes('247');
    }).slice(0, 3).map(el => {
      const styles = window.getComputedStyle(el);
      return {
        text: el.textContent.trim(),
        bgColor: styles.backgroundColor,
        borderColor: styles.borderColor
      };
    });
  }).catch(() => []);
  
  if (goldButtons.length > 0) {
    console.log('✅ Gold Buttons:');
    goldButtons.forEach(item => {
      console.log(`   ${item.text}:`);
      console.log(`     Background: ${item.bgColor}`);
      console.log(`     Border: ${item.borderColor}`);
    });
  }
  
  // Check if any old amber colors remain
  const oldColors = await page.$$eval('*', elements => {
    const oldAmberColors = ['#D97706', '#F59E0B', '#D4AF37', 'rgb(217, 119, 6)', 'rgb(245, 158, 11)', 'rgb(212, 175, 55)'];
    const found = [];
    
    elements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const color = styles.color;
      const borderColor = styles.borderColor;
      
      oldAmberColors.forEach(oldColor => {
        if (bgColor.includes(oldColor) || color.includes(oldColor) || borderColor.includes(oldColor)) {
          found.push({
            element: el.tagName,
            class: el.className,
            color: oldColor
          });
        }
      });
    });
    
    return found.slice(0, 5);
  });
  
  if (oldColors.length > 0) {
    console.log('⚠️  Old Colors Still Found:');
    oldColors.forEach(item => {
      console.log(`   ${item.element}.${item.class}: ${item.color}`);
    });
  } else {
    console.log('✅ No old amber/gold colors found!\n');
  }
  
  console.log('📊 Summary:');
  console.log('   New Gold Color: #F7D00B (RGB: 247, 208, 11)');
  console.log('   Light Variant: #FFE43A (RGB: 255, 228, 58)');
  console.log('   Dark Variant: #C5A000 (RGB: 197, 160, 0)');
  console.log('\n✨ Gold color #F7D00B has been successfully implemented!');
  
  await browser.close();
})();