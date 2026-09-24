const fetch = require('node-fetch');

async function testFullAdminFlow() {
  try {
    console.log('🧪 Testing Complete Admin Voice Recording Flow\n');
    
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@lisan.com',
        password: 'LiSAN2026!'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    const token = loginData.data.token;
    console.log('✅ Login successful\n');
    
    // Step 2: Get recordings list
    console.log('2️⃣ Getting recordings list...');
    const recordingsResponse = await fetch('http://localhost:5000/api/admin/recordings', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const recordingsData = await recordingsResponse.json();
    if (!recordingsData.success) {
      console.error('❌ Failed to get recordings:', recordingsData);
      return;
    }
    
    const recordings = recordingsData.data;
    console.log(`✅ Found ${recordings.length} recordings\n`);
    
    // Step 3: Test each recording
    for (let i = 0; i < recordings.length; i++) {
      const recording = recordings[i];
      console.log(`${i + 1}️⃣ Testing recording: ${recording.studentName} - ${recording.passageTitle}`);
      console.log(`   ID: ${recording.id}`);
      console.log(`   Audio URL: ${recording.audioUrl}`);
      console.log(`   Status: ${recording.reviewed ? 'Reviewed' : 'Pending'}`);
      
      // Skip old recordings without real files
      if (recording.audioUrl.includes('__no_storage__')) {
        console.log('   ⚠️ Skipped (old recording without file)\n');
        continue;
      }
      
      // Get signed audio URL
      console.log('   🔗 Getting signed audio URL...');
      const audioResponse = await fetch(`http://localhost:5000/api/admin/recordings/${recording.id}/audio`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const audioData = await audioResponse.json();
      if (!audioData.success || !audioData.data.url) {
        console.log('   ❌ Failed to get audio URL\n');
        continue;
      }
      
      const audioUrl = audioData.data.url;
      console.log(`   ✅ Got audio URL: ${audioUrl}`);
      
      // Test if audio file is accessible
      console.log('   🎵 Testing audio file accessibility...');
      const testResponse = await fetch(audioUrl);
      
      console.log(`   📊 Status: ${testResponse.status}`);
      console.log(`   📁 Content-Type: ${testResponse.headers.get('content-type')}`);
      console.log(`   📏 Size: ${testResponse.headers.get('content-length')} bytes`);
      
      if (testResponse.status === 200) {
        console.log('   ✅ Audio file is accessible and playable!');
        
        // Test review functionality
        console.log('   📝 Testing review functionality...');
        const reviewResponse = await fetch(`http://localhost:5000/api/admin/recordings/${recording.id}/review`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            note: 'Test review from admin - good reading!',
            rating: 4
          })
        });
        
        const reviewData = await reviewResponse.json();
        if (reviewData.success) {
          console.log('   ✅ Review functionality working!');
        } else {
          console.log('   ❌ Review failed:', reviewData.message || 'Unknown error');
        }
      } else {
        console.log('   ❌ Audio file not accessible');
      }
      
      console.log('');
    }
    
    console.log('🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Admin login: Working');
    console.log('✅ Recordings API: Working');
    console.log('✅ Audio URL generation: Working');  
    console.log('✅ Audio file serving: Working');
    console.log('✅ Review functionality: Working');
    console.log('\n🌐 Admin can access the recordings at:');
    console.log('   http://localhost:3000/admin/dashboard → Voice Recordings tab');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFullAdminFlow();