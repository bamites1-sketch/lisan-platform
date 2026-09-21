// Test Local Backend Server
const LOCAL_BACKEND_URL = 'http://localhost:5000';

async function testLocalServer() {
  console.log('🧪 TESTING LOCAL BACKEND SERVER');
  console.log('===============================\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    const healthResponse = await fetch(`${LOCAL_BACKEND_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log(`   ✅ Response: ${healthData}`);
    } else {
      console.log('   ❌ Health check failed');
      return;
    }

    // 2. Test Admin Login
    console.log('\n2️⃣ Testing Admin Login...');
    const loginResponse = await fetch(`${LOCAL_BACKEND_URL}/api/auth/login`, {
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
      if (loginJson.success && loginJson.data && loginJson.data.token) {
        console.log('   🎉 LOGIN SUCCESS! Token received');
        console.log('   🔑 Admin Credentials:');
        console.log('       Email: admin@lisan.com');
        console.log('       Password: LiSAN2026!');
        
        console.log('\n📋 LOCAL BACKEND WORKING!');
        console.log('==========================');
        console.log('✅ Server: Running on http://localhost:5000');
        console.log('✅ Database: Connected');
        console.log('✅ Login: Working');
        console.log('✅ Admin User: Ready');
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('1. Update frontend .env to point to localhost:5000');
        console.log('2. Run frontend locally');
        console.log('3. Test login functionality');
        
        return true;
      } else {
        console.log('   ❌ Login failed - no token in response');
        console.log(`   Response: ${loginData}`);
      }
    } catch (e) {
      console.log('   ❌ Login failed - invalid JSON response');
      console.log(`   Raw response: ${loginData}`);
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('\n🔍 Possible Issues:');
    console.log('- Backend server is not running');
    console.log('- Port 5000 is blocked');
    console.log('- CORS configuration issues');
  }

  return false;
}

testLocalServer();