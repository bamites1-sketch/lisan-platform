// Vercel serverless function entry point
const path = require('path');
const fs = require('fs');

// Check if compiled dist exists
const distPath = path.join(__dirname, '../dist/server.js');
if (!fs.existsSync(distPath)) {
  console.error('Dist folder not found. Build may have failed.');
  module.exports = (req, res) => {
    res.status(500).json({ error: 'Server build failed' });
  };
} else {
  // Load the compiled Express app
  const app = require(distPath);
  module.exports = app;
}
