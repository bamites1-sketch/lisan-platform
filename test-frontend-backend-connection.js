// Test the exact scenario the frontend is experiencing
const FRONTEND_ORIGIN = 'https://readpath-frontend.vercel.app';
const BACKEND_URL = 'https://readpathbackend-fm8jnxat.b4a.run';

async function testConnection() {
  console.log('🧪 Testing Frontend → Backend Connection\n');
  console.log('Frontend Origin:', FRONTEND_ORIGIN);
  console.log('Backend URL:', BACKEND_URL);
  console.log('');
  
  // Test 1: Health check
  console.log('Test 1: Health Check');
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    const data = await res.json();
    console.log('✅', data);
  } catch (e) {
    console.log('❌', e.message);
  }
  console.log('');
  
  // Test 2: CORS preflight
  console.log('Test 2: CORS Preflight');
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    console.log('Status:', res.status);
    const corsHeaders = {};
    for (const [key, value] of res.headers.entries()) {
      if (key.includes('access-control') || key.includes('cors')) {
        corsHeaders[key] = value;
      }
    }
    console.log('CORS Headers:', corsHeaders);
  } catch (e) {
    console.log('❌', e.message);
  }
  console.log('');
  
  // Test 3: Actual login request (as browser would send it)
  console.log('Test 3: Login Request with Frontend Origin');
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
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
    
    console.log('Status:', res.status);
    
    const text = await res.text();
    console.log('Response length:', text.length, 'bytes');
    
    try {
      const data = JSON.parse(text);
      if (data.success) {
        console.log('✅ Login successful!');
        console.log('User:', data.data.user.email, '-', data.data.user.role);
      } else {
        console.log('❌ Login failed:', data.message);
      }
    } catch (e) {
      console.log('❌ Invalid JSON response');
      console.log('Response text:', text.substring(0, 200));
    }
  } catch (e) {
    console.log('❌ Network error:', e.message);
  }
  console.log('');
  
  // Test 4: Register request
  console.log('Test 4: Register Request');
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_ORIGIN
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
        grade: '5'
      })
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    
    if (data.success) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', data.message);
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
}

testConnection();
