import { spawn } from 'child_process';

const args = process.argv.slice(2);
const cleanedArgs = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--host') {
    // Convert --host to Next.js compatible -H
    cleanedArgs.push('-H');
  } else {
    cleanedArgs.push(arg);
  }
}

// Build the arguments to pass to next dev
const nextArgs = ['dev'];

// Make sure we always fallback to port 3000 if not specified
if (!cleanedArgs.includes('-p') && !cleanedArgs.includes('--port')) {
  nextArgs.push('-p', '3000');
}

nextArgs.push(...cleanedArgs);

console.log('Starting wrapper: next ' + nextArgs.join(' '));

const child = spawn('npx', ['next', ...nextArgs], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  process.exit(code || 0);
});
