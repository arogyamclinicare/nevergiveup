const { chromium } = require('playwright');

async function debugTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/debug-01-app-loaded.png' });
    
    console.log('🔍 Checking what elements are available...');
    const deliveryTab = await page.locator('text=Delivery').first();
    if (await deliveryTab.isVisible()) {
      console.log('✅ Delivery tab found');
      await deliveryTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/debug-02-delivery-tab-clicked.png' });
      
      // Check what's actually on the page
      const pageContent = await page.textContent('body');
      console.log('📄 Page content:', pageContent.substring(0, 500));
      
      // Look for any shop names
      const shopElements = await page.locator('text=jai ambe kirana').all();
      console.log('🏪 Found shop elements:', shopElements.length);
      
      if (shopElements.length > 0) {
        console.log('✅ Shop found, clicking...');
        await shopElements[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/debug-03-shop-clicked.png' });
      }
    } else {
      console.log('❌ Delivery tab not found');
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    await page.screenshot({ path: 'screenshots/debug-error.png' });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

debugTest().catch(console.error);

