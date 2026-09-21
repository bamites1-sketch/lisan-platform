// Test Render Backend
const BACKEND_URL = 'https://lisan-backend-nl8c.onrender.com';

async function testRenderBackend() {
  try {
    console.log('🧪 Testing Render backend...');
    console.log('URL:', `${BACKEND_URL}/health`);
    
    // Test health endpoint
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    console.log('Health status:', healthResponse.status);
    const healthData = await healthResponse.text();
    console.log('Health response:', healthData);
    
    console.log('\n🔐 Testing login endpoint...');
    // Test login endpoint
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@readpath.com',
        password: 'admin123456'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    const loginData = await loginResponse.text();
    console.log('Login response:', loginData);
    
    try {
      const json = JSON.parse(loginData);
      console.log('✅ Login successful! Token received:', !!json.token);
    } catch (e) {
      console.log('❌ Login failed - not JSON response');
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testRenderBackend();