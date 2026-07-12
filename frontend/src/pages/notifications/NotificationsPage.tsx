import { App, List, Button, Flex, Badge, Typography, Segmented, Empty } from 'antd';
import { CheckOutlined, BellOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import dayjs from 'dayjs';
import { notificationsService, type NotificationFilters } from '../../services/notifications.service';
import { apiErrorMessage } from '../../services/apiClient';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [filters, setFilters] = useState<NotificationFilters>({});

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationsService.list(filters),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: invalidate,
    onError: (e) => message.error(apiErrorMessage(e)),
  });
  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => { message.success('All marked read'); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <div>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <Segmented
          options={[{ label: 'All', value: 'all' }, { label: 'Unread', value: 'unread' }]}
          onChange={(v) => setFilters(v === 'unread' ? { isRead: 'false' } : {})}
        />
        <Badge count={data?.unreadCount ?? 0}>
          <Button icon={<CheckOutlined />} onClick={() => markAll.mutate()} loading={markAll.isPending} disabled={!data?.unreadCount}>
            Mark all read
          </Button>
        </Badge>
      </Flex>

      <List
        loading={isLoading}
        locale={{ emptyText: <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        dataSource={data?.items ?? []}
        renderItem={(n) => (
          <List.Item
            style={{ background: n.isRead ? undefined : 'var(--af-primary-bg, rgba(113,75,103,0.06))', paddingInline: 12, borderRadius: 8 }}
            actions={
              n.isRead
                ? []
                : [
                    <Button key="read" type="link" size="small" onClick={() => markRead.mutate(n.id)}>
                      Mark read
                    </Button>,
                  ]
            }
          >
            <List.Item.Meta
              avatar={<Badge dot={!n.isRead}><BellOutlined style={{ fontSize: 18 }} /></Badge>}
              title={<Typography.Text strong={!n.isRead}>{n.message}</Typography.Text>}
              description={
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {n.type} · {dayjs(n.createdAt).format('MMM D, YYYY HH:mm')}
                </Typography.Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}
