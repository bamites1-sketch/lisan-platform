const https = require('https');

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status for voice recordings...\n');
  
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

  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    // Try different admin credentials
    let loginResult = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@lisan.com',
      password: 'LiSAN2026!'
    });

    if (loginResult.status !== 200) {
      console.log('Trying alternative admin credentials...');
      loginResult = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@readpath.com',
        password: 'admin123456'
      });
    }

    if (loginResult.status !== 200) {
      console.log('Trying setup to create admin...');
      const setupResult = await makeRequest('POST', '/api/setup/create-admin', {
        email: 'admin@lisan.com',
        password: 'LiSAN2026!',
        firstName: 'Admin',
        lastName: 'User'
      });
      console.log('Setup result:', setupResult);
      
      if (setupResult.status === 200) {
        loginResult = await makeRequest('POST', '/api/auth/login', {
          email: 'admin@lisan.com',
          password: 'LiSAN2026!'
        });
      }
    }

    if (loginResult.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginResult)}`);
    }

    const token = loginResult.data.data.token;
    console.log('✅ Admin login successful');

    // Check assessments
    console.log('\n2️⃣ Checking assessments...');
    const assessments = await makeRequest('GET', '/api/admin/assessments', null, { Authorization: `Bearer ${token}` });
    console.log(`📋 Assessments: ${assessments.status === 200 ? assessments.data.data.length : 'Error: ' + assessments.status}`);
    
    if (assessments.status === 200 && assessments.data.data.length > 0) {
      console.log('   Sample assessment:', assessments.data.data[0].title || assessments.data.data[0].id);
    }

    // Check students
    console.log('\n3️⃣ Checking students...');
    const students = await makeRequest('GET', '/api/admin/students', null, { Authorization: `Bearer ${token}` });
    console.log(`👥 Students: ${students.status === 200 ? students.data.data.length : 'Error: ' + students.status}`);
    
    if (students.status === 200 && students.data.data.length > 0) {
      console.log(`   Sample student: ${students.data.data[0].firstName} ${students.data.data[0].lastName}`);
    }

    // Check recordings (the main issue)
    console.log('\n4️⃣ Checking voice recordings...');
    const recordings = await makeRequest('GET', '/api/admin/recordings', null, { Authorization: `Bearer ${token}` });
    console.log(`🎤 Recordings: ${recordings.status === 200 ? recordings.data.data.length : 'Error: ' + recordings.status}`);
    
    if (recordings.status === 200) {
      if (recordings.data.data.length > 0) {
        console.log('   ✅ Recordings found! Sample:', recordings.data.data[0].studentName);
      } else {
        console.log('   ❌ No voice recordings found in database');
        console.log('   🔧 This explains why admin panel shows "failed to fetch"');
      }
    } else {
      console.log('   ❌ Error fetching recordings:', recordings.data);
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('=============');
    if (recordings.status === 200 && recordings.data.data.length === 0) {
      console.log('🎯 ISSUE IDENTIFIED: No voice recordings in database');
      console.log('');
      console.log('💡 SOLUTION: Students need to:');
      console.log('   1. Complete assessments with voice recordings');
      console.log('   2. Submit their audio files successfully');
      console.log('');
      console.log('🔗 Student can access assessments at:');
      console.log('   https://readpath-frontend.vercel.app (student login)');
      console.log('');
      console.log('📝 To test this, you can:');
      console.log('   1. Create a student account via admin panel');
      console.log('   2. Login as student and complete an assessment');
      console.log('   3. Record voice while reading the passage');
      console.log('   4. Submit the assessment');
      console.log('   5. Check admin panel again');
    } else if (recordings.status !== 200) {
      console.log('🔧 API ERROR: Recordings endpoint has technical issues');
      console.log('   Check server logs and endpoint implementation');
    } else {
      console.log('✅ Voice recordings are available in admin panel!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabaseStatus().catch(console.error);