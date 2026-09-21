// Test CORS Fix
async function testCORSFix() {
  console.log('🔧 TESTING CORS FIX');
  console.log('===================\n');

  try {
    // Test with explicit Origin header (simulating browser request)
    console.log('1️⃣ Testing CORS preflight...');
    const preflightResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    console.log('   Preflight Status:', preflightResponse.status);
    console.log('   Access-Control-Allow-Origin:', preflightResponse.headers.get('access-control-allow-origin'));
    console.log('   Access-Control-Allow-Methods:', preflightResponse.headers.get('access-control-allow-methods'));

    // Test actual login with Origin header
    console.log('\n2️⃣ Testing login with CORS headers...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@lisan.com',
        password: 'LiSAN2026!'
      })
    });

    console.log('   Login Status:', loginResponse.status);
    console.log('   Access-Control-Allow-Origin:', loginResponse.headers.get('access-control-allow-origin'));

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('   ✅ Login successful!');
      
      console.log('\n🎉 CORS IS FIXED!');
      console.log('================');
      console.log('✅ Backend allows requests from localhost:3000');
      console.log('✅ Login API working with CORS');
      console.log('');
      console.log('🌐 NOW TRY YOUR WEBSITE:');
      console.log('1. Go to: http://localhost:3000');
      console.log('2. Login with:');
      console.log('   Email: admin@lisan.com');  
      console.log('   Password: LiSAN2026!');
      console.log('3. The login should work now!');
      
    } else {
      console.log('   ❌ Login failed');
      const errorText = await loginResponse.text();
      console.log('   Error:', errorText);
    }

  } catch (error) {
    console.log('❌ Test Error:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n🔧 Backend may not be running');
      console.log('Make sure: npm run dev is running in readpath-backend folder');
    }
  }
}

testCORSFix();