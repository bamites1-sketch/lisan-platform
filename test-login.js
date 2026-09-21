// Test Login Endpoint
const BACKEND_URL = 'https://readpathbackend-fm8jnxat.b4a.run';

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    console.log('URL:', `${BACKEND_URL}/api/auth/login`);
    
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@readpath.com',
        password: 'admin123456'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.log('Not JSON response');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testLogin();
