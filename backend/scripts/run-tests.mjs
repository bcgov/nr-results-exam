import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testsRoot = path.resolve(__dirname, '..', '__tests__');

const collectTests = (dir) => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTests(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
};

const testFiles = collectTests(testsRoot).sort();

if (testFiles.length === 0) {
  console.error('No backend test files found under __tests__');
  process.exit(1);
}

const forwardedArgs = (() => {
  const separatorIndex = process.argv.indexOf('--');
  if (separatorIndex === -1) {
    return [];
  }
  return process.argv.slice(separatorIndex + 1);
})();

// Build clean environment without NODE_OPTIONS to prevent debugger wait
const cleanEnv = { ...process.env };
delete cleanEnv.NODE_OPTIONS;

// Use execFile instead of spawn to avoid inheriting debugger connections
// This prevents "Waiting for the debugger to disconnect..." hang
const args = [ '--test', ...forwardedArgs, ...testFiles ];

execFile(process.execPath, args, {
  env: cleanEnv,
  stdio: 'inherit',
  timeout: 300000 // 5 minute timeout
}, (error, stdout, stderr) => {
  if (error) {
    if (error.code === 'TIMEOUT') {
      console.error('Test execution timed out');
      process.exit(1);
    } else {
      console.error('Test execution failed:', error.message);
      process.exit(error.code || 1);
    }
  } else {
    process.exit(0);
  }
});

