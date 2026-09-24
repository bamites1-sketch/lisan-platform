// Vercel serverless function entry point
require('dotenv').config();

// Import the compiled server
const app = require('../dist/server.js').default || require('../dist/server.js');

module.exports = app;