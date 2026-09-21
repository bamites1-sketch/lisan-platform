// Simulate exactly what the browser does
const FRONTEND_URL = 'https://readpath-frontend.vercel.app';

async function testBrowserFlow() {
  console.log('🔍 Testing login flow as browser would...\n');
  
  // Step 1: Check what apiBase the frontend would use
  console.log('Step 1: Checking frontend environment');
  console.log('Expected API URL: https://readpathbackend-fm8jnxat.b4a.run');
  console.log('');
  
  // Step 2: Test direct API call (what should work)
  console.log('Step 2: Testing direct backend API call');
  try {
    const response = await fetch('https://readpathbackend-fm8jnxat.b4a.run/api/auth/login', {
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
    
    console.log('✅ Status:', response.status);
    console.log('✅ Headers:', Object.fromEntries([...response.headers.entries()].filter(([k]) => 
      k.includes('cors') || k.includes('access-control')
    )));
    
    const data = await response.json();
    console.log('✅ Response:', data.success ? 'Login successful' : 'Login failed');
    console.log('');
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('');
  }
  
  // Step 3: Test CORS preflight
  console.log('Step 3: Testing CORS preflight (OPTIONS)');
  try {
    const response = await fetch('https://readpathbackend-fm8jnxat.b4a.run/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ CORS Headers:');
    for (const [key, value] of response.headers.entries()) {
      if (key.includes('access-control')) {
        console.log(`   ${key}: ${value}`);
      }
    }
    console.log('');
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('');
  }
  
  // Step 4: Summary
  console.log('📋 Summary:');
  console.log('');
  console.log('If Step 2 succeeded but frontend still fails, the issue is likely:');
  console.log('1. Frontend is using wrong API URL (empty string or undefined)');
  console.log('2. VITE_API_URL environment variable not loaded in Vercel');
  console.log('');
  console.log('Solution: Set VITE_API_URL in Vercel dashboard manually');
  console.log('Go to: https://vercel.com/dashboard');
  console.log('→ readpath-frontend → Settings → Environment Variables');
  console.log('→ Add: VITE_API_URL = https://readpathbackend-fm8jnxat.b4a.run');
}

testBrowserFlow();
