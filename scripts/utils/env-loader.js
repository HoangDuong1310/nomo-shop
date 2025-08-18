// Utility để load environment variables
// Ưu tiên .env.local (development) > .env (production) > defaults

const fs = require('fs');
const path = require('path');

function loadEnvConfig() {
  // Kiểm tra file .env.local trước (development)
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envPath = path.join(process.cwd(), '.env');
  
  let envFile = '';
  
  if (fs.existsSync(envLocalPath)) {
    envFile = '.env.local';
    console.log('📄 Loading environment from .env.local (development)');
  } else if (fs.existsSync(envPath)) {
    envFile = '.env';
    console.log('📄 Loading environment from .env (production)');
  } else {
    console.log('⚠️  No .env file found, using defaults');
  }
  
  if (envFile) {
    require('dotenv').config({ path: envFile });
  }
}

module.exports = { loadEnvConfig };
