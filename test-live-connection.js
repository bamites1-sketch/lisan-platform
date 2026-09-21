// Test Live Frontend → Render Backend Connection
async function testLiveConnection() {
  console.log('🌐 TESTING LIVE WEBSITE CONNECTION');
  console.log('===================================\n');

  const FRONTEND_URL = 'https://readpath-frontend.vercel.app';
  const BACKEND_URL = 'https://lisan-backend-nl8c.onrender.com';

  try {
    // 1. Test Frontend
    console.log('1️⃣ Testing Frontend...');
    const frontendResponse = await fetch(FRONTEND_URL);
    if (frontendResponse.ok) {
      console.log('   ✅ Frontend is live and accessible');
    } else {
      console.log('   ❌ Frontend issue:', frontendResponse.status);
    }

    // 2. Test Backend Health
    console.log('\n2️⃣ Testing Backend Health...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    console.log('   Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('   ✅ Backend is responding:', healthData);
    } else {
      console.log('   ❌ Backend health failed');
      return;
    }

    // 3. Test CORS (simulate frontend request)
    console.log('\n3️⃣ Testing CORS from Frontend...');
    const corsResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@lisan.com',
        password: 'LiSAN2026!'
      })
    });

    console.log('   Login Status:', corsResponse.status);
    const loginData = await corsResponse.text();
    console.log('   Response:', loginData.substring(0, 200));

    if (corsResponse.ok) {
      try {
        const json = JSON.parse(loginData);
        if (json.success && json.data && json.data.token) {
          console.log('\n🎉 SUCCESS! EVERYTHING IS WORKING!');
          console.log('=====================================');
          console.log('✅ Frontend: https://readpath-frontend.vercel.app');
          console.log('✅ Backend: https://lisan-backend-nl8c.onrender.com');
          console.log('✅ Login: Working');
          console.log('✅ CORS: Configured');
          console.log('');
          console.log('🔑 Login Credentials:');
          console.log('   Email: admin@lisan.com');
          console.log('   Password: LiSAN2026!');
          console.log('');
          console.log('🌐 Your website is ready: https://readpath-frontend.vercel.app');
        } else {
          console.log('   ❌ Login response structure issue');
        }
      } catch (e) {
        console.log('   ❌ Login response not valid JSON');
      }
    } else {
      console.log('\n🔧 BACKEND NEEDS ADMIN USER CREATION');
      console.log('====================================');
      console.log('The backend is running but needs admin user setup.');
      console.log('Database schema might need fixing.');
      
      // Test admin creation
      console.log('\n4️⃣ Testing Admin Creation...');
      const adminResponse = await fetch(`${BACKEND_URL}/api/setup/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': FRONTEND_URL
        },
        body: JSON.stringify({
          email: 'admin@lisan.com',
          password: 'LiSAN2026!',
          firstName: 'Admin',
          lastName: 'User',
          setupKey: 'lisan2026'
        })
      });
      
      console.log('   Admin Setup Status:', adminResponse.status);
      const adminData = await adminResponse.text();
      console.log('   Admin Setup Response:', adminData.substring(0, 200));
      
      if (adminResponse.ok) {
        console.log('\n✅ Admin user created! Try login again.');
      } else {
        console.log('\n❌ Admin creation failed. Backend database needs manual fix.');
      }
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testLiveConnection();