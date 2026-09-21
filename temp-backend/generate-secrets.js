#!/usr/bin/env node

/**
 * Generate Secure JWT Secrets for Production
 * 
 * Run this to generate secure random secrets for your .env file
 */

const crypto = require('crypto');

console.log('\n🔐 Secure JWT Secrets for Production\n');
console.log('Copy these to your Render environment variables:\n');
console.log('─'.repeat(70));

const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log(`\nJWT_SECRET=${jwtSecret}`);
console.log(`\nJWT_REFRESH_SECRET=${jwtRefreshSecret}`);

console.log('\n' + '─'.repeat(70));
console.log('\n⚠️  Keep these secrets secure!');
console.log('   Never commit them to git or share them publicly.\n');
