#!/usr/bin/env node

/**
 * Kill processes using port 8080
 * Cross-platform Node.js script
 */

import { execSync } from 'child_process';

const PORTS = [8080];

console.log('🔍 Checking for processes on port 8080...\n');

for (const port of PORTS) {
  try {
    let command;

    // Platform-specific commands
    if (process.platform === 'win32') {
      // Windows
      command = `netstat -ano | findstr :${port}`;
    } else {
      // Unix-like (macOS, Linux)
      command = `lsof -ti:${port}`;
    }

    const output = execSync(command, { encoding: 'utf-8' }).trim();

    if (output) {
      // Extract PID
      let pid;
      if (process.platform === 'win32') {
        // Parse Windows netstat output - PID is in the last column
        const lines = output.split('\n');
        const pidMatch = lines[0].match(/\s+(\d+)\s*$/);
        pid = pidMatch ? pidMatch[1] : null;
      } else {
        // Unix: lsof returns PID directly
        pid = output.split('\n')[0];
      }

      if (pid) {
        console.log(`❌ Found process on port ${port} (PID: ${pid})`);

        // Kill the process
        const killCommand = process.platform === 'win32'
          ? `taskkill /F /PID ${pid}`
          : `kill -9 ${pid}`;

        execSync(killCommand);
        console.log(`✅ Killed process on port ${port}`);
      }
    } else {
      console.log(`✓ Port ${port} is free`);
    }
  } catch (error) {
    // No process found or command failed
    console.log(`✓ Port ${port} is free`);
  }
}

console.log('\n✨ Ports are clear! You can now run: npm run dev');
