const fetch = require('node-fetch');

async function testDirectAudio() {
  try {
    // Test direct access to an audio file
    const audioUrl = 'http://localhost:5000/uploads/recordings/1790232246349-77f1deed6064cf13fd6c4b8c327c850d.webm';
    
    console.log('🎵 Testing direct audio access...');
    console.log('🔗 URL:', audioUrl);
    
    const response = await fetch(audioUrl);
    
    console.log('📊 Status:', response.status);
    console.log('📁 Content-Type:', response.headers.get('content-type'));
    console.log('📏 Content-Length:', response.headers.get('content-length'));
    
    if (response.status === 200) {
      console.log('✅ Audio file is accessible!');
      console.log('🎧 The admin should be able to play this file');
      
      // Get first few bytes to verify it's a real file
      const buffer = await response.buffer();
      console.log('📋 File size:', buffer.length, 'bytes');
      console.log('🔍 First 20 bytes (hex):', buffer.slice(0, 20).toString('hex'));
      
      // Check if it looks like a WebM file (starts with specific bytes)
      const isWebM = buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
      console.log('📂 Is valid WebM file:', isWebM ? '✅ Yes' : '❌ No');
      
    } else {
      console.log('❌ Audio file not accessible');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDirectAudio();