import { useState } from 'react';
import { Button, Table, Select, Flex, Tooltip, Typography, type TableProps } from 'antd';
import { PlusOutlined, RollbackOutlined } from '@ant-design/icons';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { allocationsService, type AllocationFilters } from '../../../services/allocations.service';
import { StatusTag } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { PERMISSION } from '../../../types/permissions';
import { AllocationStatus } from '../../../types/enums';
import type { Allocation } from '../../../types/models';
import { AllocateModal } from './AllocateModal';
import { ReturnModal } from './ReturnModal';

const PAGE_SIZE = 10;

export function AllocationsTab() {
  const { can } = useAuth();
  const [filters, setFilters] = useState<AllocationFilters>({ page: 1, take: PAGE_SIZE });
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [returning, setReturning] = useState<Allocation | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['allocations', filters],
    queryFn: () => allocationsService.list(filters),
    placeholderData: keepPreviousData,
  });

  const columns: TableProps<Allocation>['columns'] = [
    { title: 'Asset', key: 'asset', render: (_, a) => <span>{a.asset?.assetTag} — {a.asset?.name}</span> },
    { title: 'Holder', key: 'holder', render: (_, a) => a.allocatedToUser?.name ?? '—' },
    { title: 'Allocated', key: 'at', render: (_, a) => dayjs(a.allocatedAt).format('MMM D, YYYY') },
    {
      title: 'Due',
      key: 'due',
      render: (_, a) =>
        a.expectedReturnDate ? (
          <Typography.Text type={a.status === 'OVERDUE' ? 'danger' : undefined}>
            {dayjs(a.expectedReturnDate).format('MMM D, YYYY')}
          </Typography.Text>
        ) : (
          <span className="af-muted">—</span>
        ),
    },
    { title: 'Status', key: 'status', render: (_, a) => <StatusTag status={a.status} /> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, a) =>
        a.status !== 'RETURNED' && can(PERMISSION.RETURN_APPROVE) ? (
          <Tooltip title="Return / check-in">
            <Button size="small" icon={<RollbackOutlined />} onClick={() => setReturning(a)}>
              Return
            </Button>
          </Tooltip>
        ) : null,
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 180 }}
          options={Object.values(AllocationStatus).map((s) => ({ value: s, label: s }))}
          onChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))}
        />
        {can(PERMISSION.ASSET_ALLOCATE) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAllocateOpen(true)}>
            Allocate asset
          </Button>
        )}
      </Flex>

      <Table<Allocation>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{
          current: filters.page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => setFilters((f) => ({ ...f, page })),
        }}
      />

      <AllocateModal open={allocateOpen} onClose={() => setAllocateOpen(false)} />
      <ReturnModal allocation={returning} onClose={() => setReturning(null)} />
    </div>
  );
}
