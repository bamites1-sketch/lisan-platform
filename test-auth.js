const https = require('https');

async function testAuth() {
  console.log('🔐 Testing authentication...\n');
  
  const backend = 'https://readpath-backend.vercel.app';
  
  const makeRequest = (method, path, data = null, headers = {}) => {
    return new Promise((resolve) => {
      const options = {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = https.request(`${backend}${path}`, options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', (err) => resolve({ error: err.message }));
      req.setTimeout(15000, () => {
        req.destroy();
        resolve({ error: 'timeout' });
      });

      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  };

  // Test 1: Health check
  console.log('1️⃣ Testing health endpoint...');
  const health = await makeRequest('GET', '/health');
  console.log(`Health: ${health.status === 200 ? '✅ OK' : '❌ Failed'} (${health.status})`);
  
  // Test 2: Setup admin reset (should work without auth)
  console.log('\n2️⃣ Resetting admin credentials...');
  const reset = await makeRequest('POST', '/api/setup/reset-admin', {
    email: 'admin@lisan.com',
    password: 'LiSAN2026!',
    firstName: 'Admin',
    lastName: 'User'
  });
  console.log(`Admin reset: ${reset.status} - ${reset.data?.message || reset.data?.error || JSON.stringify(reset.data)}`);

  // Test 3: Login attempt
  console.log('\n3️⃣ Testing login...');
  const login = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@lisan.com',
    password: 'LiSAN2026!'
  });
  console.log(`Login: ${login.status} - ${login.data?.message || login.data?.error || 'Success'}`);
  
  if (login.status === 200 && login.data?.data?.token) {
    const token = login.data.data.token;
    console.log(`✅ Token received: ${token.substring(0, 20)}...`);
    
    // Test 4: Protected endpoint
    console.log('\n4️⃣ Testing protected endpoint...');
    const protected = await makeRequest('GET', '/api/admin/dashboard', null, {
      Authorization: `Bearer ${token}`
    });
    console.log(`Dashboard: ${protected.status === 200 ? '✅ OK' : '❌ Failed'} (${protected.status})`);
    
    if (protected.status === 200) {
      console.log('\n🎉 AUTHENTICATION IS WORKING!');
      console.log('✅ Admin can login and access protected routes');
    } else {
      console.log('\n❌ Auth token issue:', protected.data);
    }
  } else {
    console.log('\n❌ Login failed, checking possible causes...');
    
    // Try to find what admins exist
    console.log('\n5️⃣ Checking admin creation...');
    const createAdmin = await makeRequest('POST', '/api/setup/create-admin', {
      email: 'admin@lisan.com',
      password: 'LiSAN2026!',
      firstName: 'Admin',
      lastName: 'User'
    });
    console.log(`Create admin: ${createAdmin.status} - ${createAdmin.data?.message || createAdmin.data?.error}`);
  }
}

testAuth().catch(console.error);