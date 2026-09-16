// Vercel serverless function entry point
const path = require('path');

// Load the compiled Express app
const app = require('../dist/server.js');

module.exports = app;
