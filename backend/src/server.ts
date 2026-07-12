import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { initSocket } from './lib/socket.js';
import { registerEventHandlers } from './lib/events.js';
import { ensureSeeded, loadPermissions } from './lib/rbac.js';
import { startJobs } from './jobs/index.js';
import { SETTINGS } from './lib/settings.js';

const app = createApp();
const httpServer = createServer(app);

initSocket(httpServer); // Socket.io for live notifications
registerEventHandlers(); // domain events -> activity log + notifications

async function bootstrap(): Promise<void> {
  await ensureSeeded(); // seed the RBAC matrix from defaults on first run
  await loadPermissions(); // load the editable permission matrix into memory
  startJobs(); // node-cron: overdue detection + booking rollover

  httpServer.listen(SETTINGS.port, () => {
    console.log(`🚀 AssetFlow API running at http://localhost:${SETTINGS.port}`);
    console.log(`   Health:  http://localhost:${SETTINGS.port}/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start AssetFlow API', err);
  process.exit(1);
});
