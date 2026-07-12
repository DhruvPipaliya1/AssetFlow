import { useEffect } from 'react';
import { App } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '../lib/socket';
import { tokenStore } from '../services/apiClient';
import type { Notification } from '../types/models';

// Connect the Socket.io client (JWT handshake) and, on `notification:new`, fire
// an antd toast + refresh the notifications queries (bell badge + feed). Mounted
// once from the authenticated app shell.
export function useSocketNotifications() {
  const { notification } = App.useApp();
  const qc = useQueryClient();

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;
    const socket = connectSocket(token);

    const handler = (n: Notification) => {
      notification.open({ message: 'AssetFlow', description: n.message, placement: 'topRight' });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification:new', handler);
    return () => {
      socket.off('notification:new', handler);
    };
  }, [notification, qc]);
}
