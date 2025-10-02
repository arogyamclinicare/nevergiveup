const { chromium } = require('playwright');
const path = require('path');

async function runMilkDeliveryTest() {
  console.log('🚀 Starting Milk Delivery App Test Automation...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down actions for better screenshots
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone size
    deviceScaleFactor: 2
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('📱 Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-app-loaded.png' });
    console.log('✅ App loaded successfully');

    // Step 1: Add deliveries to multiple shops
    console.log('🚚 Step 1: Adding deliveries to shops...');
    
    // Add delivery to jai ambe kirana
    await page.click('text=Delivery');
    await page.waitForSelector('[data-testid="shop-list"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/02-delivery-shop-list.png' });
    
    await page.click('text=jai ambe kirana');
    await page.waitForSelector('[data-testid="product-selection"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/03-jai-ambe-products.png' });
    
    // Add Smart-26: 2 packets = ₹544
    await page.click('button:has-text("Smart - 26") >> nth=0'); // First + button
    await page.click('button:has-text("Smart - 26") >> nth=0'); // Second + button
    await page.screenshot({ path: 'screenshots/04-jai-ambe-smart26-added.png' });
    
    // Add Tone milk: 3 packets = ₹31.50
    await page.click('button:has-text("Tone milk") >> nth=0');
    await page.click('button:has-text("Tone milk") >> nth=0');
    await page.click('button:has-text("Tone milk") >> nth=0');
    await page.screenshot({ path: 'screenshots/05-jai-ambe-tone-milk-added.png' });
    
    // Save delivery
    await page.click('button:has-text("Save Delivery")');
    await page.waitForSelector('text=✅ Delivery saved successfully!', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/06-jai-ambe-delivery-saved.png' });
    console.log('✅ jai ambe kirana delivery saved (₹575.50)');

    // Add delivery to Pune Fresh Dairy
    await page.click('text=Pune Fresh Dairy');
    await page.waitForSelector('[data-testid="product-selection"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/07-pune-fresh-products.png' });
    
    // Add Vikas gold: 2 packets = ₹71
    await page.click('button:has-text("Vikas gold") >> nth=0');
    await page.click('button:has-text("Vikas gold") >> nth=0');
    await page.screenshot({ path: 'screenshots/08-pune-fresh-vikas-added.png' });
    
    // Add Dahi: 1 packet = ₹18
    await page.click('button:has-text("Dahi") >> nth=0');
    await page.screenshot({ path: 'screenshots/09-pune-fresh-dahi-added.png' });
    
    // Save delivery
    await page.click('button:has-text("Save Delivery")');
    await page.waitForSelector('text=✅ Delivery saved successfully!', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/10-pune-fresh-delivery-saved.png' });
    console.log('✅ Pune Fresh Dairy delivery saved (₹89)');

    // Add delivery to banu kirana
    await page.click('text=banu kirana');
    await page.waitForSelector('[data-testid="product-selection"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/11-banu-kirana-products.png' });
    
    // Add Smart-26: 1 packet = ₹272
    await page.click('button:has-text("Smart - 26") >> nth=0');
    await page.screenshot({ path: 'screenshots/12-banu-kirana-smart26-added.png' });
    
    // Add DTM: 2 packets = ₹18
    await page.click('button:has-text("DTM") >> nth=0');
    await page.click('button:has-text("DTM") >> nth=0');
    await page.screenshot({ path: 'screenshots/13-banu-kirana-dtm-added.png' });
    
    // Save delivery
    await page.click('button:has-text("Save Delivery")');
    await page.waitForSelector('text=✅ Delivery saved successfully!', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/14-banu-kirana-delivery-saved.png' });
    console.log('✅ banu kirana delivery saved (₹290)');

    // Step 2: Go to Collection tab
    console.log('💰 Step 2: Testing Collection tab...');
    await page.click('text=Collection');
    await page.waitForSelector('[data-testid="collection-view"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/15-collection-initial-view.png' });
    console.log('✅ Collection tab loaded');

    // Test jai ambe kirana - Full Payment
    console.log('💳 Testing jai ambe kirana - Full Payment...');
    await page.click('text=jai ambe kirana');
    await page.waitForSelector('[data-testid="payment-modal"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/16-jai-ambe-payment-modal.png' });
    
    await page.click('button:has-text("Full Amount")');
    await page.screenshot({ path: 'screenshots/17-jai-ambe-full-amount-selected.png' });
    
    await page.click('button:has-text("Process Payment")');
    await page.waitForSelector('text=✅ Payment processed successfully!', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/18-jai-ambe-payment-success.png' });
    console.log('✅ jai ambe kirana payment processed');

    // Test Pune Fresh Dairy - Partial Payment
    console.log('💳 Testing Pune Fresh Dairy - Partial Payment...');
    await page.click('text=Pune Fresh Dairy');
    await page.waitForSelector('[data-testid="payment-modal"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/19-pune-fresh-payment-modal.png' });
    
    await page.click('button:has-text("Custom")');
    await page.fill('input[placeholder="Enter amount"]', '50');
    await page.screenshot({ path: 'screenshots/20-pune-fresh-custom-amount.png' });
    
    await page.click('button:has-text("Process Payment")');
    await page.waitForSelector('text=✅ Payment processed successfully!', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/21-pune-fresh-payment-success.png' });
    console.log('✅ Pune Fresh Dairy partial payment processed (₹50 of ₹89)');

    // Test banu kirana - Pay Tomorrow
    console.log('⏰ Testing banu kirana - Pay Tomorrow...');
    await page.click('text=banu kirana');
    await page.waitForSelector('[data-testid="payment-modal"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/22-banu-kirana-payment-modal.png' });
    
    await page.click('button:has-text("Pay Tomorrow")');
    await page.waitForSelector('text=✅ Payment processed successfully!', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/23-banu-kirana-pay-tomorrow-success.png' });
    console.log('✅ banu kirana marked as Pay Tomorrow');

    // Check Collection view after payments
    console.log('📊 Checking Collection view after payments...');
    await page.screenshot({ path: 'screenshots/24-collection-after-payments.png' });
    
    // Test "Show Pending List Only" button
    await page.click('button:has-text("Show Pending List Only")');
    await page.screenshot({ path: 'screenshots/25-collection-pending-list-only.png' });
    console.log('✅ Pending list view tested');

    // Test "Show All Shops" button
    await page.click('button:has-text("Show All Shops")');
    await page.screenshot({ path: 'screenshots/26-collection-all-shops.png' });
    console.log('✅ All shops view tested');

    // Step 3: Test Simulate Tomorrow
    console.log('📅 Step 3: Testing Simulate Tomorrow...');
    await page.click('text=Home');
    await page.waitForSelector('[data-testid="home-screen"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/27-home-screen.png' });
    
    await page.click('button:has-text("Simulate Tomorrow")');
    await page.waitForSelector('text=✅ Simulated tomorrow!', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/28-simulate-tomorrow-success.png' });
    console.log('✅ Simulate Tomorrow completed');

    // Check Collection view after reset
    await page.click('text=Collection');
    await page.waitForSelector('[data-testid="collection-view"]', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/29-collection-after-reset.png' });
    
    // Test "Show Pending List Only" after reset
    await page.click('button:has-text("Show Pending List Only")');
    await page.screenshot({ path: 'screenshots/30-collection-pending-after-reset.png' });
    console.log('✅ Collection view after reset tested');

    console.log('🎉 Test automation completed successfully!');
    console.log('📸 All screenshots saved in screenshots/ folder');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/error-screenshot.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
runMilkDeliveryTest().catch(console.error);
