// Test Admin Setup on Render
const BACKEND_URL = 'https://lisan-backend-nl8c.onrender.com';

async function testAdminSetup() {
  try {
    console.log('🛠️ Testing admin setup...');
    
    const response = await fetch(`${BACKEND_URL}/api/setup/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@readpath.com',
        password: 'admin123456',
        name: 'ReadPath Admin',
        setupKey: 'lisan2026'
      })
    });

    console.log('Setup status:', response.status);
    const data = await response.text();
    console.log('Setup response:', data);

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Admin user created or already exists!');
      
      // Now test login
      console.log('\n🔐 Testing login with admin user...');
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
        if (json.token) {
          console.log('🎉 LOGIN SUCCESSFUL! Backend is working!');
        }
      } catch (e) {
        console.log('❌ Login failed - response not JSON');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAdminSetup();