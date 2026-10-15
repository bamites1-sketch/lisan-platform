const axios = require('axios');

const BACKEND_URL = 'https://readpath-backend.vercel.app';

async function testBackend() {
    try {
        console.log('🔐 Testing login...');
        
        const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            email: 'admin@lisan.com',
            password: 'LiSAN2026!'
        });

        console.log('✅ Login response:', {
            success: response.data.success,
            userId: response.data.user?.id,
            role: response.data.user?.role,
            tokenLength: response.data.token?.length
        });

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testBackend();