const fetch = require('node-fetch');

async function testRecordings() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login to get token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@lisan.com',
        password: 'LiSAN2026!'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok || !loginData.data?.token) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginData.data.token;
    
    // Test the recordings endpoint
    console.log('🎙️ Testing recordings endpoint...');
    
    const recordingsResponse = await fetch('http://localhost:5000/api/admin/recordings', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const recordingsData = await recordingsResponse.json();
    
    console.log('📊 Response status:', recordingsResponse.status);
    console.log('📋 Response data:', JSON.stringify(recordingsData, null, 2));
    
    if (recordingsData.success && recordingsData.data) {
      console.log(`🎵 Found ${recordingsData.data.length} recordings`);
      recordingsData.data.forEach((recording, index) => {
        console.log(`${index + 1}. ${recording.studentName} - ${recording.passageTitle}`);
        console.log(`   Audio: ${recording.audioUrl ? '✅ Yes' : '❌ No'}`);
        console.log(`   Status: ${recording.reviewed ? 'Reviewed' : 'Pending'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRecordings();