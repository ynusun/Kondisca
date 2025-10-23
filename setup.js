#!/usr/bin/env node

/**
 * Kondisca Setup Script
 * This script helps set up the development environment
 */

const fs = require('fs');
const path = require('path');

console.log('🏀 Kondisca Setup Script');
console.log('========================\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, 'env.local');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envLocalPath)) {
  console.log('📝 Creating env.local file...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envLocalPath);
    console.log('✅ env.local file created from env.example');
  } else {
    console.log('❌ env.example file not found');
  }
} else {
  console.log('✅ env.local file already exists');
}

console.log('\n🔧 Next steps:');
console.log('1. Update env.local with your Supabase credentials');
console.log('2. Run: npm install');
console.log('3. Run: npm run dev');
console.log('\n📚 For deployment instructions, see DEPLOYMENT.md');

console.log('\n🎯 Environment Variables Required:');
console.log('- VITE_SUPABASE_URL');
console.log('- VITE_SUPABASE_ANON_KEY');
console.log('- VITE_APP_ENV (optional, defaults to development)');

console.log('\n🚀 Happy coding!');
