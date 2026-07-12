import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { SETTINGS } from './settings.js';
import { verifyAccessToken } from './jwt.js';

let io: SocketServer | null = null;

// Socket.io with JWT handshake auth; each user joins a private room `user:<id>`
// so notifications can be targeted.
export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: SETTINGS.clientOrigin },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('unauthorized'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string | undefined;
    if (userId) socket.join(`user:${userId}`);
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
