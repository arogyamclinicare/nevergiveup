const { chromium } = require('playwright');

async function fixedTest() {
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
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  try {
    console.log('📱 Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/fixed-01-app-loaded.png' });
    
    // Click Delivery tab using the button element
    console.log('🚚 Clicking Delivery tab button...');
    const deliveryButton = page.locator('button:has-text("Delivery")').first();
    await deliveryButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/fixed-02-delivery-tab-clicked.png' });
    
    // Check if we're now on the delivery screen
    const deliveryTitle = await page.locator('text=Select Shop').first();
    if (await deliveryTitle.isVisible()) {
      console.log('✅ Delivery screen loaded');
      
      // Wait for shops to load
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/fixed-03-delivery-screen.png' });
      
      // Check for shops
      const shopElements = await page.locator('text=jai ambe kirana').all();
      console.log('🏪 Found shops:', shopElements.length);
      
      if (shopElements.length > 0) {
        console.log('✅ Shops loaded, clicking jai ambe kirana...');
        await shopElements[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/fixed-04-shop-selected.png' });
        
        // Check if product selection loaded
        const productButtons = await page.locator('button:has-text("Smart - 26")').all();
        console.log('📦 Found product buttons:', productButtons.length);
        
        if (productButtons.length > 0) {
          console.log('✅ Product selection loaded');
          await page.screenshot({ path: 'screenshots/fixed-05-product-selection.png' });
          
          // Add Smart-26
          await productButtons[0].click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'screenshots/fixed-06-smart26-added.png' });
          
          // Save delivery
          await page.click('button:has-text("Save Delivery")');
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'screenshots/fixed-07-delivery-saved.png' });
          
          console.log('✅ Delivery saved successfully!');
        }
      } else {
        console.log('❌ No shops found');
        // Check for error messages
        const errorText = await page.textContent('body');
        console.log('📄 Page content:', errorText.substring(0, 500));
      }
    } else {
      console.log('❌ Delivery screen not loaded');
      const currentContent = await page.textContent('body');
      console.log('📄 Current content:', currentContent.substring(0, 500));
    }
    
    // Test Collection tab
    console.log('💰 Testing Collection tab...');
    const collectionButton = page.locator('button:has-text("Collection")').first();
    await collectionButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/fixed-08-collection-tab.png' });
    
    // Check if collection screen loaded
    const collectionTitle = await page.locator('text=Collect payments from shops').first();
    if (await collectionTitle.isVisible()) {
      console.log('✅ Collection screen loaded');
      
      // Check for shops in collection
      const collectionShops = await page.locator('text=jai ambe kirana').all();
      console.log('🏪 Shops in collection:', collectionShops.length);
      
      if (collectionShops.length > 0) {
        console.log('✅ Shop found in collection, clicking...');
        await collectionShops[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/fixed-09-payment-modal.png' });
        
        // Test Pay Tomorrow button
        const payTomorrowButton = await page.locator('button:has-text("Pay Tomorrow")').first();
        if (await payTomorrowButton.isVisible()) {
          console.log('⏰ Testing Pay Tomorrow button...');
          await payTomorrowButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'screenshots/fixed-10-pay-tomorrow-clicked.png' });
          
          // Check collection view after Pay Tomorrow
          await collectionButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'screenshots/fixed-11-collection-after-pay-tomorrow.png' });
          
          // Test Show Pending List Only
          const pendingButton = await page.locator('button:has-text("Show Pending List Only")').first();
          if (await pendingButton.isVisible()) {
            console.log('📋 Testing Show Pending List Only...');
            await pendingButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'screenshots/fixed-12-pending-list-only.png' });
          }
        }
      } else {
        console.log('❌ No shops found in collection');
      }
    } else {
      console.log('❌ Collection screen not loaded');
    }
    
    console.log('🎉 Fixed test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/fixed-error.png' });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

fixedTest().catch(console.error);

