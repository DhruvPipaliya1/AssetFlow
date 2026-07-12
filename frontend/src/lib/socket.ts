import { io, type Socket } from 'socket.io-client';
import { ENV } from '../config/env';

// Single shared Socket.io connection. The JWT goes in the handshake auth (the
// backend joins the client to a private `user:<id>` room). Connect on login,
// disconnect on logout — see hooks/useSocketNotifications.
let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(ENV.wsUrl, { auth: { token }, autoConnect: true });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
