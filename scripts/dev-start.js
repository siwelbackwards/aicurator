#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AI Curator development environment...');
console.log('This will start both Next.js dev server and Netlify functions server');

// Check if we're in the right directory
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

console.log(`📁 Working directory: ${projectRoot}`);

// Start Next.js dev server
console.log('🔷 Starting Next.js dev server...');
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

// Start Netlify functions dev server
console.log('🟢 Starting Netlify functions dev server...');
const netlifyProcess = spawn('node', ['netlify/dev-server.js'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

// Handle Next.js output
nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[NEXT] ${output.trim()}`);
});

nextProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(`[NEXT ERROR] ${output.trim()}`);
});

// Handle Netlify functions output
netlifyProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[NETLIFY] ${output.trim()}`);
});

netlifyProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(`[NETLIFY ERROR] ${output.trim()}`);
});

// Handle process exits
nextProcess.on('close', (code) => {
  console.log(`❌ Next.js process exited with code ${code}`);
  if (netlifyProcess.pid) {
    netlifyProcess.kill();
  }
  process.exit(code);
});

netlifyProcess.on('close', (code) => {
  console.log(`❌ Netlify functions process exited with code ${code}`);
  if (nextProcess.pid) {
    nextProcess.kill();
  }
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  
  if (nextProcess.pid) {
    nextProcess.kill('SIGINT');
  }
  
  if (netlifyProcess.pid) {
    netlifyProcess.kill('SIGINT');
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

console.log('✅ Development environment starting...');
console.log('📝 Press Ctrl+C to stop both servers');
console.log('🌐 Next.js will be available at: http://localhost:3000');
console.log('⚡ Netlify functions will be available at: http://localhost:9000'); 