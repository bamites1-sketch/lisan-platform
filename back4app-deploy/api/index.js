// Vercel serverless function entry point
const path = require('path');

// Set environment for production
process.env.NODE_ENV = 'production';

// Load the compiled Express app
const app = require('../dist/server.js');

module.exports = app;
