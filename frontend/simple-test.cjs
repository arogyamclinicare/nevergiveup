const { chromium } = require('playwright');

async function simpleTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/simple-01-app-loaded.png' });
    
    // Click Delivery tab
    console.log('🚚 Clicking Delivery tab...');
    await page.click('text=Delivery');
    await page.waitForTimeout(3000); // Wait for shops to load
    await page.screenshot({ path: 'screenshots/simple-02-delivery-tab.png' });
    
    // Check if shops are loaded
    const shopNames = await page.locator('text=jai ambe kirana').all();
    console.log('🏪 Found shops:', shopNames.length);
    
    if (shopNames.length > 0) {
      console.log('✅ Shops loaded, clicking jai ambe kirana...');
      await shopNames[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/simple-03-shop-selected.png' });
      
      // Check if product selection screen loaded
      const productButtons = await page.locator('button:has-text("Smart - 26")').all();
      console.log('📦 Found product buttons:', productButtons.length);
      
      if (productButtons.length > 0) {
        console.log('✅ Product selection loaded, adding Smart-26...');
        await productButtons[0].click(); // First + button
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/simple-04-product-added.png' });
        
        // Save delivery
        await page.click('button:has-text("Save Delivery")');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/simple-05-delivery-saved.png' });
        
        console.log('✅ Delivery saved successfully!');
      }
    }
    
    // Test Collection tab
    console.log('💰 Testing Collection tab...');
    await page.click('text=Collection');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/simple-06-collection-tab.png' });
    
    // Check if shop appears in collection
    const collectionShops = await page.locator('text=jai ambe kirana').all();
    console.log('🏪 Shops in collection:', collectionShops.length);
    
    if (collectionShops.length > 0) {
      console.log('✅ Shop found in collection, clicking...');
      await collectionShops[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/simple-07-payment-modal.png' });
      
      // Test Pay Tomorrow button
      const payTomorrowButton = await page.locator('button:has-text("Pay Tomorrow")').first();
      if (await payTomorrowButton.isVisible()) {
        console.log('⏰ Testing Pay Tomorrow button...');
        await payTomorrowButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/simple-08-pay-tomorrow-clicked.png' });
        
        // Check collection view after Pay Tomorrow
        await page.click('text=Collection');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/simple-09-collection-after-pay-tomorrow.png' });
        
        // Test Show Pending List Only
        const pendingButton = await page.locator('button:has-text("Show Pending List Only")').first();
        if (await pendingButton.isVisible()) {
          console.log('📋 Testing Show Pending List Only...');
          await pendingButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'screenshots/simple-10-pending-list-only.png' });
        }
      }
    }
    
    console.log('🎉 Simple test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/simple-error.png' });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

simpleTest().catch(console.error);

