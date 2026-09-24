// Quick debug script to check CORS config
const express = require('express');
const cors = require('cors');

const app = express();

console.log('Environment variables:');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
console.log('Allowed origins:', allowedOrigins);

// Test CORS config
app.use(cors({
  origin: (origin, cb) => {
    console.log('CORS check - Origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    console.log('Origin allowed:', !origin || allowedOrigins.includes(origin));
    
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/debug-cors', (req, res) => {
  res.json({
    frontendUrl: process.env.FRONTEND_URL,
    allowedOrigins: allowedOrigins,
    origin: req.headers.origin,
    corsHeaders: {
      'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin'),
      'access-control-allow-credentials': res.getHeader('Access-Control-Allow-Credentials')
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});