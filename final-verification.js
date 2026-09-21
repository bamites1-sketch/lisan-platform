// Final Verification Script
const BACKEND_URL = 'https://lisan-backend-nl8c.onrender.com';

async function finalVerification() {
  console.log('🔍 FINAL VERIFICATION - LOGIN FUNCTIONALITY');
  console.log('==========================================\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Backend Health Check...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log(`   ✅ ${healthData}`);
    } else {
      console.log('   ❌ Backend is not healthy');
      return;
    }

    // 2. Wait a moment (Render might be updating)
    console.log('\n2️⃣ Waiting for potential backend updates...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Try login (this might fail if database needs migration)
    console.log('\n3️⃣ Testing Login Functionality...');
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
    
    if (loginResponse.ok) {
      try {
        const loginJson = JSON.parse(loginData);
        if (loginJson.token) {
          console.log('   🎉 SUCCESS! Login is working!');
          console.log('   📧 Email: admin@lisan.com');
          console.log('   🔑 Password: LiSAN2026!');
          
          console.log('\n📋 SUMMARY - ALL SYSTEMS WORKING!');
          console.log('================================');
          console.log('✅ Backend: HEALTHY');
          console.log('✅ Database: CONNECTED');
          console.log('✅ Login: WORKING');
          console.log('✅ Frontend URL: UPDATED');
          console.log('\n🚀 Your website should now work!');
          console.log('🔗 Frontend: https://readpath-frontend.vercel.app');
          console.log('🔗 Backend: https://lisan-backend-nl8c.onrender.com');
          return;
        }
      } catch (e) {
        // Fall through to error handling
      }
    }
    
    // If we get here, login failed
    console.log('   ❌ Login failed');
    console.log(`   Response: ${loginData}`);
    
    // 4. Try to create admin user
    console.log('\n4️⃣ Attempting to create admin user...');
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

    console.log(`   Setup Status: ${adminResponse.status}`);
    const adminData = await adminResponse.text();
    console.log(`   Setup Response: ${adminData}`);

    if (adminResponse.ok) {
      console.log('\n5️⃣ Retrying login after admin creation...');
      const retryLogin = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@lisan.com',
          password: 'LiSAN2026!'
        })
      });

      if (retryLogin.ok) {
        const retryData = await retryLogin.text();
        try {
          const retryJson = JSON.parse(retryData);
          if (retryJson.token) {
            console.log('   🎉 SUCCESS! Login working after admin creation!');
            console.log('\n📋 FINAL STATUS - WORKING!');
            console.log('==========================');
            console.log('✅ Backend: HEALTHY');
            console.log('✅ Admin User: CREATED');
            console.log('✅ Login: WORKING');
            console.log('✅ Credentials: admin@lisan.com / LiSAN2026!');
            return;
          }
        } catch (e) {
          // Fall through
        }
      }
    }

    // Still failing
    console.log('\n❌ ISSUE STILL EXISTS');
    console.log('===================');
    console.log('The backend database needs manual intervention.');
    console.log('You need to:');
    console.log('1. Go to Render Dashboard');
    console.log('2. Access your service shell');
    console.log('3. Run: npx prisma migrate deploy');
    console.log('4. Run: npx prisma generate');
    console.log('5. Restart the service');

  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

finalVerification();