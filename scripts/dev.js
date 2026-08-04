const { spawn } = require('child_process');
const path = require('path');

console.log('=====================================================');
console.log('  Starting IRMS Backend and Frontend Concurrently...');
console.log('=====================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Start backend dev server
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, '../backend'),
  stdio: 'inherit',
  shell: true
});

// Start frontend dev server
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.resolve(__dirname, '../frontend'),
  stdio: 'inherit',
  shell: true
});

// Handle graceful termination
process.on('SIGINT', () => {
  console.log('\nStopping both backend and frontend servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  frontend.kill();
  process.exit(code || 0);
});

frontend.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  backend.kill();
  process.exit(code || 0);
});
