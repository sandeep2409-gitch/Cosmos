import { spawn } from 'child_process';
import fileServer from 'http-server';

/**
 * COSMOS One-Command Unified Launcher
 * Starts Express API Backend (Port 5000) & Frontend Web Server (Port 8080) in one command.
 */

console.log(`\x1b[36m=======================================================\x1b[0m`);
console.log(`\x1b[1m\x1b[33m🚀 LAUNCHING COSMOS EXPLORATION ENGINE...\x1b[0m`);
console.log(`\x1b[36m=======================================================\x1b[0m`);

// 1. Spawn Express Backend API Server (Port 5000)
const backendProcess = spawn('node', ['server/server.js'], {
  stdio: 'inherit',
  shell: true
});

// 2. Start Frontend Static Web Server (Port 8080)
const server = fileServer.createServer({
  root: '.',
  cache: -1
});

if (server.server) {
  server.server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`\x1b[33mℹ Frontend 3D server running on port 8080: \x1b[1mhttp://localhost:8080\x1b[0m`);
    }
  });
}

try {
  server.listen(8080, () => {
    console.log(`\x1b[32m✔ 3D Frontend Application: \x1b[1mhttp://localhost:8080\x1b[0m`);
    console.log(`\x1b[32m✔ Express API Engine:      \x1b[1mhttp://localhost:5000/api/v1/health\x1b[0m`);
    console.log(`\x1b[36m-------------------------------------------------------\x1b[0m`);
    console.log(`Press Ctrl+C to stop all servers.`);
  });
} catch (e) {
  // Ignored
}

const cleanup = () => {
  console.log('\nShutting down COSMOS engine servers...');
  try { backendProcess.kill(); } catch (e) {}
  try { server.close(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
