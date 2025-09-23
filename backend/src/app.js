const express = require('express');
const cors = require('cors');
const urlController = require('./controllers/urlController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/check-url', urlController.checkURL);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SecureQR Backend is running' });
});

module.exports = app;