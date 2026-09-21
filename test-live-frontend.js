// Test Live Frontend Deployment
async function testLiveFrontend() {
  console.log('🌐 TESTING LIVE FRONTEND DEPLOYMENT');
  console.log('===================================\n');

  const LIVE_FRONTEND = 'https://readpath-frontend.vercel.app';
  const EXPECTED_BACKEND = 'https://lisan-backend-nl8c.onrender.com';

  try {
    // 1. Test if frontend loads
    console.log('1️⃣ Testing frontend accessibility...');
    const frontendResponse = await fetch(LIVE_FRONTEND);
    
    if (frontendResponse.ok) {
      console.log('   ✅ Frontend is accessible');
    } else {
      console.log('   ❌ Frontend not accessible');
      console.log('   Status:', frontendResponse.status);
      return;
    }

    // 2. Test the backend the frontend is trying to reach
    console.log('\n2️⃣ Testing backend that frontend will call...');
    const backendHealth = await fetch(`${EXPECTED_BACKEND}/health`);
    
    console.log('   Backend Status:', backendHealth.status);
    
    if (backendHealth.ok) {
      const healthData = await backendHealth.text();
      console.log('   ✅ Backend is responding:', healthData);
      
      // Test login
      console.log('\n3️⃣ Testing backend login...');
      const loginResponse = await fetch(`${EXPECTED_BACKEND}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': LIVE_FRONTEND
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'admin@lisan.com',
          password: 'LiSAN2026!'
        })
      });

      console.log('   Login Status:', loginResponse.status);
      
      if (loginResponse.ok) {
        console.log('   ✅ Backend login works!');
        
        console.log('\n🎉 WEBSITE SHOULD BE WORKING!');
        console.log('=============================');
        console.log('✅ Frontend: Deployed and accessible');
        console.log('✅ Backend: Responding and login working');
        console.log('');
        console.log('🌐 Try your website: https://readpath-frontend.vercel.app');
        console.log('🔑 Login: admin@lisan.com / LiSAN2026!');
        
      } else {
        const errorText = await loginResponse.text();
        console.log('   ❌ Backend login failed');
        console.log('   Error:', errorText.substring(0, 200));
        
        console.log('\n🔧 BACKEND NEEDS FIXING');
        console.log('======================');
        console.log('The frontend is deployed correctly, but the backend has issues.');
        console.log('Follow the BACKEND_DEPLOYMENT_GUIDE.md to fix the backend.');
      }
      
    } else {
      console.log('   ❌ Backend is not responding');
      
      console.log('\n🔧 BACKEND IS DOWN');
      console.log('==================');
      console.log('The frontend is deployed but backend is not working.');
      console.log('Options:');
      console.log('1. Fix Render deployment (see BACKEND_DEPLOYMENT_GUIDE.md)');
      console.log('2. Deploy new backend (run deploy-backend-vercel.ps1)');
    }

  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

testLiveFrontend();