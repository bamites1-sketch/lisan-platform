// Test what API URL the frontend is using
const fetch = require('node-fetch');

async function testFrontend() {
  try {
    console.log('Fetching frontend HTML...');
    const response = await fetch('https://readpath-frontend.vercel.app');
    const html = await response.text();
    
    // Look for the built JavaScript files
    const scriptMatches = html.match(/src="([^"]*\.js)"/g);
    if (scriptMatches) {
      console.log('\nFound script files:');
      scriptMatches.forEach(match => console.log('  -', match));
    }
    
    // Check if there's any inline config
    if (html.includes('VITE_API_URL')) {
      console.log('\n✅ Found VITE_API_URL in HTML');
    } else {
      console.log('\n❌ VITE_API_URL not found in HTML - environment variable may not be set');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testFrontend();
