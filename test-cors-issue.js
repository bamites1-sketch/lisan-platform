// Test CORS issue with Back4app backend
const FRONTEND_URL = 'https://readpath-frontend.vercel.app';
const BACKEND_URL = 'https://readpathbackend-fm8jnxat.b4a.run';

async function testCORS() {
  console.log('🔍 Testing CORS Configuration\n');
  
  // Test 1: OPTIONS preflight request
  console.log('Test 1: CORS Preflight (OPTIONS)');
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('Status:', response.status);
    console.log('CORS Headers:');
    
    const corsHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('access-control') || key.toLowerCase().includes('cors')) {
        corsHeaders[key] = value;
        console.log(`  ${key}: ${value}`);
      }
    }
    
    if (Object.keys(corsHeaders).length === 0) {
      console.log('  ❌ No CORS headers found!');
    }
    
  } catch (error) {
    console.log('❌ Preflight failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Actual login request
  console.log('Test 2: Direct Login (bypassing browser CORS)');
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify({
        email: 'admin@readpath.com',
        password: 'admin123456'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Response Headers:');
    
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('access-control') || key.toLowerCase().includes('cors')) {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    const data = await response.json();
    if (data.success) {
      console.log('✅ Login works (CORS is the only issue)');
    } else {
      console.log('❌ Login failed:', data.message);
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('📋 DIAGNOSIS:');
  console.log('If preflight failed → Backend CORS not configured for frontend origin');
  console.log('If login worked → Backend works, just need to add CORS headers');
  console.log('');
  console.log('🔧 SOLUTION:');
  console.log('Update FRONTEND_URL environment variable on Back4app to:');
  console.log(`   ${FRONTEND_URL}`);
  console.log('');
  console.log('Back4app Steps:');
  console.log('1. Go to Back4app dashboard');
  console.log('2. Click on readpath-backend app');  
  console.log('3. Go to Environment Variables');
  console.log('4. Update FRONTEND_URL value');
  console.log('5. Restart the app');
}

testCORS();