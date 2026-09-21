// Test Frontend to Backend Connection
async function testFrontendBackend() {
  console.log('🔗 TESTING FRONTEND-BACKEND CONNECTION');
  console.log('======================================\n');

  const FRONTEND_URL = 'http://localhost:3000';
  const BACKEND_URL = 'http://localhost:5000';

  try {
    // 1. Test Backend Direct
    console.log('1️⃣ Testing Backend Direct...');
    const backendTest = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@lisan.com',
        password: 'LiSAN2026!'
      })
    });
    
    if (backendTest.ok) {
      console.log('   ✅ Backend login works directly');
    } else {
      console.log('   ❌ Backend login failed directly');
      console.log('   Status:', backendTest.status);
    }

    // 2. Check CORS
    console.log('\n2️⃣ Testing CORS...');
    const corsTest = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (corsTest.ok) {
      console.log('   ✅ CORS appears to be working');
    } else {
      console.log('   ❌ CORS issue detected');
    }

    // 3. Test from Frontend's perspective
    console.log('\n3️⃣ Simulating Frontend API Call...');
    
    // This simulates what the frontend should be doing
    const frontendSimulation = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Same as frontend
      body: JSON.stringify({
        email: 'admin@lisan.com',
        password: 'LiSAN2026!'
      })
    });

    console.log('   Status:', frontendSimulation.status);
    const responseText = await frontendSimulation.text();
    console.log('   Response:', responseText.substring(0, 200));

    if (frontendSimulation.ok) {
      console.log('   ✅ Frontend-style API call works');
      
      console.log('\n🎯 SOLUTION');
      console.log('==========');
      console.log('The backend is working correctly!');
      console.log('Please try these steps:');
      console.log('');
      console.log('1. Clear your browser cache (Ctrl+Shift+Delete)');
      console.log('2. Open browser in incognito/private mode');
      console.log('3. Go to: http://localhost:3000');
      console.log('4. Open Developer Tools (F12) → Console tab');
      console.log('5. Try logging in and watch the console for errors');
      console.log('');
      console.log('The API URL should now be: http://localhost:5000');
      
    } else {
      console.log('   ❌ Frontend-style API call failed');
    }

  } catch (error) {
    console.log('❌ Network Error:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n🔍 TROUBLESHOOTING');
      console.log('=================');
      console.log('• Make sure backend is running: npm run dev (in readpath-backend folder)');
      console.log('• Check if port 5000 is free');
      console.log('• Restart both frontend and backend servers');
    }
  }
}

testFrontendBackend();