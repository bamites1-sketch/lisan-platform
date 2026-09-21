// Test Frontend Configuration
const puppeteer = require('puppeteer');

async function testFrontendConfig() {
  console.log('🕵️ TESTING FRONTEND CONFIGURATION');
  console.log('==================================\n');

  let browser;
  try {
    // Launch browser
    console.log('1️⃣ Starting browser...');
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('Login attempt') || msg.text().includes('API URL')) {
        console.log('   📝', msg.text());
      }
    });

    // Go to login page
    console.log('2️⃣ Opening login page...');
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check if we can find the login form
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (emailInput && passwordInput) {
      console.log('3️⃣ Login form found, testing login...');
      
      // Fill in credentials
      await page.type('input[type="email"]', 'admin@lisan.com');
      await page.type('input[type="password"]', 'LiSAN2026!');
      
      // Click login button
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        console.log('4️⃣ Clicking login button...');
        await loginButton.click();
        
        // Wait for response
        await page.waitForTimeout(3000);
        
        // Check for error messages
        const errorElements = await page.$$eval('*', els => 
          els.filter(el => el.textContent && el.textContent.includes('login service is unavailable'))
             .map(el => el.textContent)
        );
        
        if (errorElements.length > 0) {
          console.log('❌ Still getting login error:', errorElements[0]);
        } else {
          console.log('✅ No login error found!');
        }
        
      } else {
        console.log('❌ Login button not found');
      }
    } else {
      console.log('❌ Login form not found');
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  require('puppeteer');
  testFrontendConfig();
} catch (e) {
  console.log('⚠️  Puppeteer not available. Manual testing required.');
  console.log('\n🧪 MANUAL TEST STEPS:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Console tab');
  console.log('4. Try to login with:');
  console.log('   Email: admin@lisan.com');
  console.log('   Password: LiSAN2026!');
  console.log('5. Look for login API calls in the console');
  console.log('6. Check if the URL shows http://localhost:5000');
}