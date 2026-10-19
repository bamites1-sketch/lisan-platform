const https = require('https');

function loginOnce() {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      email: 'admin@lisan.com',
      password: 'LiSAN2026!'
    });

    const options = {
      hostname: 'readpath-backend.vercel.app',
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'timeout' });
    });

    req.write(data);
    req.end();
  });
}

async function monitor() {
  console.log('Checking backend login...');
  for (let i = 1; i <= 10; i++) {
    const res = await loginOnce();
    console.log(`[Attempt ${i}] Status: ${res.status}`);
    if (res.status === 200) {
      console.log('🎉 LOGIN SUCCEEDED! Online auth is working!');
      console.log('Response:', JSON.stringify(res.data, null, 2));
      return true;
    } else {
      console.log('Error/Response:', typeof res.data === 'object' ? JSON.stringify(res.data) : res.data);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  return false;
}

monitor();
