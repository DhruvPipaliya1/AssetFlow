import { useState } from 'react';
import { App, Button, Table, Select, Flex, Space, Popconfirm, type TableProps } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { transfersService, type TransferFilters } from '../../../services/transfers.service';
import { apiErrorMessage } from '../../../services/apiClient';
import { StatusTag, WorkflowSteps, DetailModal } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { PERMISSION } from '../../../types/permissions';
import { TransferStatus } from '../../../types/enums';
import type { Transfer } from '../../../types/models';

const PAGE_SIZE = 10;
const STEPS = [
  { key: 'REQUESTED', title: 'Requested' },
  { key: 'APPROVED', title: 'Approved' },
  { key: 'COMPLETED', title: 'Completed' },
];

export function TransfersTab() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { message } = App.useApp();
  const [filters, setFilters] = useState<TransferFilters>({ page: 1, take: PAGE_SIZE });
  const [detail, setDetail] = useState<Transfer | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['transfers', filters],
    queryFn: () => transfersService.list(filters),
    placeholderData: keepPreviousData,
  });

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'APPROVE' | 'REJECT' }) =>
      transfersService.decide(id, decision),
    onSuccess: (_, { decision }) => {
      message.success(decision === 'APPROVE' ? 'Transfer approved' : 'Transfer rejected');
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['allocations'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const columns: TableProps<Transfer>['columns'] = [
    { title: 'Asset', key: 'asset', render: (_, t) => `${t.asset?.assetTag} — ${t.asset?.name}` },
    { title: 'From', key: 'from', render: (_, t) => t.fromUser?.name ?? '—' },
    { title: 'To', key: 'to', render: (_, t) => t.toUser?.name ?? '—' },
    { title: 'Status', key: 'status', render: (_, t) => <StatusTag status={t.status} /> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, t) =>
        t.status === 'REQUESTED' && can(PERMISSION.TRANSFER_APPROVE) ? (
          <Space onClick={(e) => e.stopPropagation()}>
            <Popconfirm title="Approve this transfer?" onConfirm={() => decide.mutate({ id: t.id, decision: 'APPROVE' })}>
              <Button size="small" type="primary" icon={<CheckOutlined />}>Approve</Button>
            </Popconfirm>
            <Popconfirm title="Reject this transfer?" onConfirm={() => decide.mutate({ id: t.id, decision: 'REJECT' })}>
              <Button size="small" danger icon={<CloseOutlined />}>Reject</Button>
            </Popconfirm>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <Flex justify="flex-start" style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 180 }}
          options={Object.values(TransferStatus).map((s) => ({ value: s, label: s }))}
          onChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))}
        />
      </Flex>

      <Table<Transfer>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={data?.items ?? []}
        onRow={(t) => ({ onClick: () => setDetail(t), style: { cursor: 'pointer' } })}
        pagination={{
          current: filters.page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => setFilters((f) => ({ ...f, page })),
        }}
      />

      <DetailModal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.asset?.assetTag} — ${detail.asset?.name}` : 'Transfer'}
        header={detail && <WorkflowSteps steps={STEPS} current={detail.status} error={detail.status === 'REJECTED'} />}
        items={
          detail
            ? [
                { label: 'Status', value: <StatusTag status={detail.status} /> },
                { label: 'From', value: detail.fromUser?.name },
                { label: 'To', value: detail.toUser?.name },
                { label: 'Requested by', value: detail.requestedByUser?.name },
                { label: 'Approved by', value: detail.approvedByUser?.name },
                { label: 'Requested at', value: dayjs(detail.createdAt).format('MMM D, YYYY HH:mm') },
                { label: 'Decided at', value: detail.decidedAt ? dayjs(detail.decidedAt).format('MMM D, YYYY HH:mm') : null },
              ]
            : []
        }
      />
    </div>
  );
}
