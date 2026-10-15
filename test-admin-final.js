const axios = require('axios');

const FRONTEND_URL = 'https://readpath-frontend.vercel.app';
const BACKEND_URL = 'https://readpath-backend.vercel.app';

async function testAdminFunctionality() {
    try {
        console.log('🔐 Testing admin login...');
        
        // Test login
        const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            email: 'admin@lisan.com',
            password: 'LiSAN2026!'
        });

        console.log('✅ Login successful');
        const token = loginResponse.data.token;

        // Test recordings endpoint
        console.log('🎵 Testing recordings endpoint...');
        const recordingsResponse = await axios.get(`${BACKEND_URL}/api/admin/recordings`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Found ${recordingsResponse.data.length} recordings`);
        
        if (recordingsResponse.data.length > 0) {
            const firstRecording = recordingsResponse.data[0];
            console.log('First recording:', {
                id: firstRecording.id,
                studentName: firstRecording.student?.name,
                hasAudioUrl: !!firstRecording.audioUrl
            });

            // Test audio URL endpoint
            console.log('🎧 Testing audio URL endpoint...');
            const audioResponse = await axios.get(`${BACKEND_URL}/api/admin/recordings/${firstRecording.id}/audio`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Audio URL endpoint working:', audioResponse.data);
        }

        console.log('\n🎉 All admin functionality tests passed!');
        console.log('\n🔗 Working URLs:');
        console.log(`📱 Frontend: ${FRONTEND_URL}`);
        console.log(`🌐 Backend: ${BACKEND_URL}`);
        console.log(`👤 Admin Panel: ${FRONTEND_URL}/admin`);
        console.log('🔑 Login: admin@lisan.com / LiSAN2026!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testAdminFunctionality();