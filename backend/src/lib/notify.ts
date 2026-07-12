import { prisma } from './prisma.js';
import { emitToUser } from './socket.js';

// Persist a notification AND push it live over Socket.io. One helper called by
// the event handlers (and directly where needed).
export async function notify(
  userId: string,
  type: string,
  message: string,
  entity?: { entityType?: string; entityId?: string },
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      message,
      entityType: entity?.entityType,
      entityId: entity?.entityId,
    },
  });
  emitToUser(userId, 'notification:new', notification);
  return notification;
}
