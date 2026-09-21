// Test the new backend URL
const NEW_BACKEND = 'https://readpathbackend-6ne04uax.b4a.run';
const FRONTEND_ORIGIN = 'https://readpath-frontend.vercel.app';

async function testNewBackend() {
  console.log('🧪 Testing New Backend:', NEW_BACKEND);
  console.log('');
  
  // Test 1: Health check
  try {
    const res = await fetch(`${NEW_BACKEND}/health`);
    const data = await res.json();
    console.log('✅ Health check:', data);
  } catch (e) {
    console.log('❌ Health check failed:', e.message);
  }
  
  console.log('');
  
  // Test 2: CORS preflight
  try {
    const res = await fetch(`${NEW_BACKEND}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    
    console.log('CORS Preflight Status:', res.status);
    
    const corsHeaders = {};
    for (const [key, value] of res.headers.entries()) {
      if (key.includes('access-control')) {
        corsHeaders[key] = value;
      }
    }
    
    if (Object.keys(corsHeaders).length > 0) {
      console.log('✅ CORS Headers:', corsHeaders);
    } else {
      console.log('❌ No CORS headers found');
    }
  } catch (e) {
    console.log('❌ CORS test failed:', e.message);
  }
  
  console.log('');
  
  // Test 3: Login
  try {
    const res = await fetch(`${NEW_BACKEND}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_ORIGIN
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@readpath.com',
        password: 'admin123456'
      })
    });
    
    console.log('Login Status:', res.status);
    const data = await res.json();
    
    if (data.success) {
      console.log('✅ Login successful!');
      console.log('User:', data.data.user.email, '-', data.data.user.role);
    } else {
      console.log('❌ Login failed:', data.message);
    }
  } catch (e) {
    console.log('❌ Login error:', e.message);
  }
}

testNewBackend();