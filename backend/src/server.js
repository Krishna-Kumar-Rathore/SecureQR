const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 SecureQR Backend running on port ${PORT}`);
  console.log(`🔒 Google Safe Browsing integration active`);
  console.log(`📡 API endpoints ready at http://localhost:${PORT}/api`);
});