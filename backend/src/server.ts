import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { initSocket } from './lib/socket.js';
import { registerEventHandlers } from './lib/events.js';
import { SETTINGS } from './lib/settings.js';

const app = createApp();
const httpServer = createServer(app);

initSocket(httpServer); // Socket.io for live notifications
registerEventHandlers(); // domain events -> activity log + notifications

httpServer.listen(SETTINGS.port, () => {
  console.log(`🚀 AssetFlow API running at http://localhost:${SETTINGS.port}`);
  console.log(`   Health:  http://localhost:${SETTINGS.port}/health`);
});
