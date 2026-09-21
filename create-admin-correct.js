// Create Admin User Correctly
const BACKEND_URL = 'https://lisan-backend-nl8c.onrender.com';

async function createAdmin() {
  try {
    console.log('🛠️ Creating admin user...');
    
    const response = await fetch(`${BACKEND_URL}/api/setup/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@lisan.com',
        password: 'LiSAN2026!',
        firstName: 'Admin',
        lastName: 'User',
        setupKey: 'lisan2026'
      })
    });

    console.log('Setup status:', response.status);
    const data = await response.text();
    console.log('Setup response:', data);

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Admin user created successfully!');
      
      // Test login with new admin
      console.log('\n🔐 Testing login...');
      const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@lisan.com',
          password: 'LiSAN2026!'
        })
      });
      
      console.log('Login status:', loginResponse.status);
      const loginData = await loginResponse.text();
      console.log('Login response:', loginData);
      
      try {
        const json = JSON.parse(loginData);
        if (json.token) {
          console.log('🎉 SUCCESS! Backend and admin login working!');
          console.log('📧 Admin Email: admin@lisan.com');
          console.log('🔑 Admin Password: LiSAN2026!');
        }
      } catch (e) {
        console.log('❌ Login failed');
      }
    } else {
      console.log('❌ Admin creation failed');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createAdmin();