const fetch = require('node-fetch');

async function testAudioUrl() {
  try {
    console.log('🔐 Getting admin token...');
    
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
    const token = loginData.data.token;
    
    console.log('✅ Token obtained');
    
    // Test audio URL endpoint
    const recordingId = '1b17f1d0-29e5-466a-9bce-52658f89d21d'; // Beamlak's real recording
    console.log(`🎵 Testing audio URL for recording ${recordingId}...`);
    
    const audioResponse = await fetch(`http://localhost:5000/api/admin/recordings/${recordingId}/audio`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const audioData = await audioResponse.json();
    
    console.log('📊 Audio URL response status:', audioResponse.status);
    console.log('📋 Audio URL response:', JSON.stringify(audioData, null, 2));
    
    if (audioData.success && audioData.data.url) {
      console.log('🔗 Audio URL generated successfully!');
      console.log('🎧 URL:', audioData.data.url);
      
      // Test if the URL is accessible
      console.log('\n🌐 Testing if audio URL is accessible...');
      try {
        const testResponse = await fetch(audioData.data.url);
        console.log('📊 Audio file response status:', testResponse.status);
        console.log('📁 Content-Type:', testResponse.headers.get('content-type') || 'Unknown');
        console.log('📏 Content-Length:', testResponse.headers.get('content-length') || 'Unknown');
      } catch (err) {
        console.log('❌ Audio URL not accessible:', err.message);
      }
    } else {
      console.log('❌ Failed to get audio URL');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAudioUrl();