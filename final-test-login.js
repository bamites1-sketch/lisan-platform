// Final test - simulate browser login from deployed frontend
async function finalTest() {
  console.log('🧪 Final Login Test\n');
  console.log('Testing as if from: https://readpath-frontend.vercel.app');
  console.log('Backend: https://readpathbackend-fm8jnxat.b4a.run\n');
  
  try {
    const response = await fetch('https://readpathbackend-fm8jnxat.b4a.run/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://readpath-frontend.vercel.app'
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@readpath.com',
        password: 'admin123456'
      })
    });
    
    console.log('Response Status:', response.status, response.statusText);
    
    if (response.status === 200) {
      const data = await response.json();
      if (data.success) {
        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log('\n📧 Email: admin@readpath.com');
        console.log('🔑 Password: admin123456');
        console.log('🌐 URL: https://readpath-frontend.vercel.app');
        console.log('\n🎉 Your platform is ready! Try logging in now.');
      } else {
        console.log('\n❌ Login failed:', data.message);
      }
    } else {
      console.log('\n❌ HTTP Error:', response.status);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('\n❌ Network Error:', error.message);
  }
}

finalTest();
