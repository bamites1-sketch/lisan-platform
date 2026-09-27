// Vercel serverless function entry point
require('dotenv').config();

let app;
try {
  app = require('../dist/server.js').default || require('../dist/server.js');
} catch (e) {
  app = require('../src/server.ts').default || require('../src/server.ts');
}

module.exports = app;