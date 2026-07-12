import { useEffect, useMemo, useState } from 'react';
import { App, Button, Table, Select, Flex, Space, Card, Calendar, Badge, Popconfirm, Segmented, Tooltip, Empty, Divider, Typography, type TableProps } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { bookingsService, type BookingFilters } from '../../services/bookings.service';
import { assetsService } from '../../services/assets.service';
import { apiErrorMessage } from '../../services/apiClient';
import { StatusTag, DetailModal } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSION } from '../../types/permissions';
import { BookingStatus } from '../../types/enums';
import type { Booking } from '../../types/models';
import { BookingFormModal } from './components/BookingFormModal';
import { RescheduleModal } from './components/RescheduleModal';

const PAGE_SIZE = 10;

export default function BookingsPage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { message } = App.useApp();
  const [filters, setFilters] = useState<BookingFilters>({ page: 1, take: PAGE_SIZE });
  const [formOpen, setFormOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [calAssetId, setCalAssetId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const { data, isFetching } = useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => bookingsService.list(filters),
    placeholderData: keepPreviousData,
  });
  const { data: bookableAssets } = useQuery({
    queryKey: ['assets', { isBookable: 'true', take: 100 }],
    queryFn: () => assetsService.list({ isBookable: 'true', take: 100 }),
  });
  const { data: feed = [] } = useQuery({
    queryKey: ['bookings', 'feed', calAssetId],
    queryFn: () => bookingsService.assetFeed(calAssetId!),
    enabled: !!calAssetId,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => bookingsService.cancel(id),
    onSuccess: () => {
      message.success('Booking cancelled');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  // Auto-select the first bookable resource so the calendar shows immediately.
  useEffect(() => {
    if (!calAssetId && bookableAssets?.items?.length) setCalAssetId(bookableAssets.items[0].id);
  }, [bookableAssets, calAssetId]);

  // Bookings grouped by day for the resource calendar.
  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of feed) {
      const key = dayjs(b.startTime).format('YYYY-MM-DD');
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    return map;
  }, [feed]);

  const dayBookings = (byDay.get(selectedDate.format('YYYY-MM-DD')) ?? [])
    .slice()
    .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());

  const columns: TableProps<Booking>['columns'] = [
    { title: 'Resource', key: 'asset', render: (_, b) => `${b.asset?.assetTag} — ${b.asset?.name}` },
    { title: 'Booked by', key: 'by', render: (_, b) => b.bookedByUser?.name ?? '—' },
    { title: 'Start', key: 'start', render: (_, b) => dayjs(b.startTime).format('MMM D, HH:mm') },
    { title: 'End', key: 'end', render: (_, b) => dayjs(b.endTime).format('MMM D, HH:mm') },
    { title: 'Status', key: 'status', render: (_, b) => <StatusTag status={b.status} /> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, b) =>
        b.status === 'UPCOMING' || b.status === 'ONGOING' ? (
          <Space onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Reschedule">
              <Button size="small" icon={<EditOutlined />} onClick={() => setRescheduling(b)} />
            </Tooltip>
            <Popconfirm title="Cancel this booking?" onConfirm={() => cancel.mutate(b.id)}>
              <Button size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 160 }}
            options={Object.values(BookingStatus).map((s) => ({ value: s, label: s }))}
            onChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))}
          />
          <Segmented
            options={[{ label: 'All', value: 'all' }, { label: 'Mine', value: 'mine' }]}
            onChange={(v) => setFilters((f) => ({ ...f, mine: v === 'mine' ? 'true' : undefined, page: 1 }))}
          />
        </Space>
        {can(PERMISSION.BOOKING_CREATE) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
            New booking
          </Button>
        )}
      </Flex>

      <Table<Booking>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={data?.items ?? []}
        onRow={(b) => ({ onClick: () => setDetail(b), style: { cursor: 'pointer' } })}
        pagination={{
          current: filters.page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => setFilters((f) => ({ ...f, page })),
        }}
        style={{ marginBottom: 24 }}
      />

      <Card
        title="Resource calendar"
        extra={
          <Select
            allowClear
            placeholder="Pick a resource"
            style={{ width: 260 }}
            value={calAssetId}
            options={(bookableAssets?.items ?? []).map((a) => ({ value: a.id, label: `${a.assetTag} — ${a.name}` }))}
            onChange={setCalAssetId}
          />
        }
      >
        {calAssetId ? (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 340px', minWidth: 300 }}>
              <Calendar
                fullscreen={false}
                onSelect={(d) => setSelectedDate(d)}
                cellRender={(current: Dayjs, info) => {
                  if (info.type !== 'date') return info.originNode;
                  const items = byDay.get(current.format('YYYY-MM-DD')) ?? [];
                  return (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {items.slice(0, 2).map((b) => (
                        <li key={b.id}>
                          <Badge status="processing" text={dayjs(b.startTime).format('HH:mm')} />
                        </li>
                      ))}
                      {items.length > 2 && <li>+{items.length - 2} more</li>}
                    </ul>
                  );
                }}
              />
            </div>
            <div style={{ flex: '1 1 260px', minWidth: 240 }}>
              <Divider titlePlacement="start" style={{ marginTop: 0 }}>
                {selectedDate.format('ddd, MMM D')}
              </Divider>
              {dayBookings.length === 0 ? (
                <Empty description="No bookings this day" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'var(--af-hover-bg)',
                      }}
                    >
                      <span>
                        <Typography.Text strong>
                          {dayjs(b.startTime).format('HH:mm')}–{dayjs(b.endTime).format('HH:mm')}
                        </Typography.Text>
                        <div>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {b.bookedByUser?.name ?? '—'}
                          </Typography.Text>
                        </div>
                      </span>
                      <StatusTag status={b.status} />
                    </div>
                  ))}
                </Space>
              )}
            </div>
          </div>
        ) : (
          <span className="af-muted">Select a bookable resource to see its schedule.</span>
        )}
      </Card>

      <BookingFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <RescheduleModal booking={rescheduling} onClose={() => setRescheduling(null)} />

      <DetailModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.asset?.assetTag} — ${detail.asset?.name}` : 'Booking'}
        items={
          detail
            ? [
                { label: 'Status', value: <StatusTag status={detail.status} /> },
                { label: 'Booked by', value: detail.bookedByUser?.name },
                { label: 'On behalf of', value: detail.onBehalfOfDepartment?.name },
                { label: 'Start', value: dayjs(detail.startTime).format('MMM D, YYYY HH:mm') },
                { label: 'End', value: dayjs(detail.endTime).format('MMM D, YYYY HH:mm') },
                { label: 'Created', value: dayjs(detail.createdAt).format('MMM D, YYYY HH:mm') },
              ]
            : []
        }
      />
    </div>
  );
}
