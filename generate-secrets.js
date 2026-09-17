const crypto = require('crypto');

console.log('=== PRODUCTION ENVIRONMENT VARIABLES ===');
console.log('');
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('');
console.log('Copy these secrets - you\'ll need them for deployment!');