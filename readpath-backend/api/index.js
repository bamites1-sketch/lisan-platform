// Vercel serverless function entry point
const path = require('path');

// Try to load the compiled Express app
try {
  const distPath = path.join(__dirname, '../dist/server.js');
  console.log('Looking for compiled server at:', distPath);
  const app = require(distPath);
  console.log('Server loaded successfully');
  module.exports = app;
} catch (error) {
  console.error('Failed to load server:', error.message);
  console.error('Stack:', error.stack);
  // Fallback: try to run TypeScript directly
  try {
    require('ts-node/register');
    const app = require('../src/server.ts');
    module.exports = app;
  } catch (tsError) {
    console.error('TypeScript fallback failed:', tsError.message);
    module.exports = (req, res) => {
      res.status(500).json({ 
        error: 'Server failed to start',
        details: error.message,
        tsError: tsError.message
      });
    };
  }
}
