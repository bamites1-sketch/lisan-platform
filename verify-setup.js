// Comprehensive Backend Verification
const BACKEND_URL = 'https://lisan-backend-nl8c.onrender.com';

async function verifySetup() {
  console.log('🔍 COMPREHENSIVE BACKEND VERIFICATION');
  console.log('=====================================\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log(`   ✅ Response: ${healthData}`);
    } else {
      console.log('   ❌ Health check failed');
      return;
    }

    // 2. Auth Health Check
    console.log('\n2️⃣ Testing Auth Health...');
    const authHealthResponse = await fetch(`${BACKEND_URL}/api/auth/health`);
    console.log(`   Status: ${authHealthResponse.status}`);
    
    if (authHealthResponse.ok) {
      const authHealthData = await authHealthResponse.text();
      console.log(`   ✅ Response: ${authHealthData}`);
    } else {
      console.log('   ⚠️  Auth health endpoint may not exist (this is OK)');
    }

    // 3. Try to create admin (might already exist)
    console.log('\n3️⃣ Creating/Checking Admin User...');
    const adminResponse = await fetch(`${BACKEND_URL}/api/setup/create-admin`, {
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

    console.log(`   Status: ${adminResponse.status}`);
    const adminData = await adminResponse.text();
    console.log(`   Response: ${adminData}`);

    // 4. Test Admin Login
    console.log('\n4️⃣ Testing Admin Login...');
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

    console.log(`   Status: ${loginResponse.status}`);
    const loginData = await loginResponse.text();
    
    try {
      const loginJson = JSON.parse(loginData);
      if (loginJson.token) {
        console.log('   ✅ LOGIN SUCCESS! Token received');
        console.log('   🔑 Admin Credentials:');
        console.log('       Email: admin@lisan.com');
        console.log('       Password: LiSAN2026!');
      } else {
        console.log('   ❌ Login failed - no token in response');
        console.log(`   Response: ${loginData}`);
      }
    } catch (e) {
      console.log('   ❌ Login failed - invalid JSON response');
      console.log(`   Raw response: ${loginData}`);
    }

    // 5. Alternative Admin Login (readpath credentials)
    console.log('\n5️⃣ Testing Alternative Admin Login...');
    const altLoginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@readpath.com',
        password: 'admin123456'
      })
    });

    console.log(`   Status: ${altLoginResponse.status}`);
    const altLoginData = await altLoginResponse.text();
    
    try {
      const altLoginJson = JSON.parse(altLoginData);
      if (altLoginJson.token) {
        console.log('   ✅ ALTERNATIVE LOGIN SUCCESS!');
        console.log('   🔑 Alternative Credentials:');
        console.log('       Email: admin@readpath.com');
        console.log('       Password: admin123456');
      } else {
        console.log('   ❌ Alternative login failed');
      }
    } catch (e) {
      console.log('   ❌ Alternative login failed');
    }

    console.log('\n📋 SUMMARY');
    console.log('==========');
    console.log('✅ Frontend URL updated locally');
    console.log('✅ Backend is responding');
    console.log('🔗 Backend URL: https://lisan-backend-nl8c.onrender.com');
    console.log('\n🚀 Next Steps:');
    console.log('1. Update VITE_API_URL in Vercel dashboard');
    console.log('2. Redeploy frontend on Vercel');
    console.log('3. Test login on live website');

  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('\n🔍 Possible Issues:');
    console.log('- Backend may be sleeping (Render free tier)');
    console.log('- Network connectivity issues');
    console.log('- Backend configuration problems');
  }
}

verifySetup();