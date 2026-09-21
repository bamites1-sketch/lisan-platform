// Test Both Back4App URLs
const B4A_URL_1 = 'https://readpathbackend-fm8jnxat.b4a.run';
const B4A_URL_2 = 'https://readpathbackend-6ne04uax.b4a.run';

async function testB4AURL(url, name) {
  console.log(`\n🔍 Testing ${name}: ${url}`);
  console.log('='.repeat(50));
  
  try {
    // Test root path
    console.log('1️⃣ Testing root path (/)...');
    const rootResponse = await fetch(url);
    console.log(`   Status: ${rootResponse.status}`);
    if (rootResponse.ok) {
      const rootText = await rootResponse.text();
      console.log(`   Response: ${rootText.substring(0, 100)}...`);
    }

    // Test health endpoint
    console.log('2️⃣ Testing /health...');
    const healthResponse = await fetch(`${url}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthText = await healthResponse.text();
      console.log(`   Response: ${healthText}`);
    }

    // Test login endpoint
    console.log('3️⃣ Testing /api/auth/login...');
    const loginResponse = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://readpath-frontend.vercel.app'
      },
      body: JSON.stringify({
        email: 'admin@lisan.com',
        password: 'LiSAN2026!'
      })
    });
    
    console.log(`   Status: ${loginResponse.status}`);
    const loginText = await loginResponse.text();
    console.log(`   Response: ${loginText.substring(0, 200)}...`);
    
    if (loginResponse.ok) {
      console.log(`   ✅ ${name} IS WORKING!`);
      return { working: true, url };
    } else {
      console.log(`   ❌ ${name} login failed`);
      return { working: false, url, error: loginText };
    }

  } catch (error) {
    console.log(`   ❌ ${name} network error: ${error.message}`);
    return { working: false, url, error: error.message };
  }
}

async function findWorkingBackend() {
  console.log('🔍 FINDING WORKING BACK4APP BACKEND');
  console.log('===================================');

  const results = [];
  
  // Test both URLs
  results.push(await testB4AURL(B4A_URL_1, 'Back4App URL 1'));
  results.push(await testB4AURL(B4A_URL_2, 'Back4App URL 2'));
  
  console.log('\n📋 SUMMARY');
  console.log('==========');
  
  const workingBackend = results.find(r => r.working);
  
  if (workingBackend) {
    console.log(`✅ WORKING BACKEND FOUND: ${workingBackend.url}`);
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Update frontend to use this URL');
    console.log('2. Redeploy frontend');
    console.log('3. Test the website');
    console.log('\n📝 UPDATE COMMAND:');
    console.log(`Update VITE_API_URL in Vercel to: ${workingBackend.url}`);
  } else {
    console.log('❌ NO WORKING BACKEND FOUND');
    console.log('\nAll Back4App backends are down or misconfigured.');
    console.log('Options:');
    console.log('1. Deploy new backend to Back4App');
    console.log('2. Use the working local backend with ngrok');
    console.log('3. Deploy to alternative service (Vercel/Render)');
  }
}

findWorkingBackend();