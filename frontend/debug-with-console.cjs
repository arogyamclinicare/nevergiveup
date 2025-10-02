const { chromium } = require('playwright');

async function debugWithConsole() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  
  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    console.log('🖥️ Console:', msg.text());
  });
  
  // Listen to network requests
  page.on('request', request => {
    console.log('🌐 Request:', request.method(), request.url());
  });
  
  // Listen to network responses
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('❌ Error Response:', response.status(), response.url());
    }
  });
  
  try {
    console.log('📱 Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/debug-console-01-app-loaded.png' });
    
    // Click Delivery tab
    console.log('🚚 Clicking Delivery tab...');
    await page.click('text=Delivery');
    await page.waitForTimeout(5000); // Wait longer for shops to load
    await page.screenshot({ path: 'screenshots/debug-console-02-delivery-tab.png' });
    
    // Check what's actually rendered
    const deliveryContent = await page.textContent('body');
    console.log('📄 Delivery page content:', deliveryContent.substring(0, 1000));
    
    // Check for any error messages
    const errorElements = await page.locator('text=Error').all();
    console.log('❌ Error elements found:', errorElements.length);
    
    // Check for loading states
    const loadingElements = await page.locator('text=Loading').all();
    console.log('⏳ Loading elements found:', loadingElements.length);
    
    // Check for shops specifically
    const shopElements = await page.locator('text=jai ambe kirana').all();
    console.log('🏪 Shop elements found:', shopElements.length);
    
    // Check if there's a "No deliveries today" message
    const noDeliveriesMessage = await page.locator('text=No deliveries today').all();
    console.log('📭 No deliveries message found:', noDeliveriesMessage.length);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    await page.screenshot({ path: 'screenshots/debug-console-error.png' });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

debugWithConsole().catch(console.error);

