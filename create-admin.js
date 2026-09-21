// Create Admin Account Script
const BACKEND_URL = 'https://readpathbackend-6ne04uax.b4a.run';

async function createAdmin() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/setup/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@readpath.com',
        password: 'admin123456',
        firstName: 'Admin',
        lastName: 'User',
        setupKey: 'development' // This will work if SETUP_KEY isn't set
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin account created successfully!');
      console.log('Email: admin@readpath.com');
      console.log('Password: admin123456');
      console.log('Login at: https://readpath-frontend.vercel.app');
    } else {
      console.log('❌ Error:', result.error || result.message);
      
      if (result.error && result.error.includes('Admin already exists')) {
        console.log('✅ Admin account already exists!');
        console.log('Email: admin@readpath.com');
        console.log('Password: admin123456');
        console.log('Login at: https://readpath-frontend.vercel.app');
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

createAdmin();