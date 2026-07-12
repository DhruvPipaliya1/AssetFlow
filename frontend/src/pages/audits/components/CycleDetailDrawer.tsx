import { useState } from 'react';
import { App, Drawer, Descriptions, Button, Select, Space, Table, Tag, Divider, Popconfirm, Spin, Empty, type TableProps } from 'antd';
import { PlayCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { auditsService } from '../../../services/audits.service';
import { employeesService } from '../../../services/employees.service';
import { apiErrorMessage } from '../../../services/apiClient';
import { StatusTag, WorkflowSteps } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { PERMISSION } from '../../../types/permissions';
import type { AuditItem } from '../../../types/models';

interface Props {
  cycleId: string | null;
  onClose: () => void;
}

const STEPS = [
  { key: 'PLANNED', title: 'Planned' },
  { key: 'IN_PROGRESS', title: 'In progress' },
  { key: 'CLOSED', title: 'Closed' },
];

export function CycleDetailDrawer({ cycleId, onClose }: Props) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { message } = App.useApp();
  const [auditorIds, setAuditorIds] = useState<string[]>([]);

  const { data: cycle, isLoading } = useQuery({
    queryKey: ['audit-cycles', cycleId],
    queryFn: () => auditsService.getCycle(cycleId!),
    enabled: !!cycleId,
  });
  const { data: items = [] } = useQuery({
    queryKey: ['audit-cycles', cycleId, 'items'],
    queryFn: () => auditsService.items(cycleId!),
    enabled: !!cycleId && cycle?.status !== 'PLANNED',
  });
  const { data: employees } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => employeesService.list({ take: '100' }),
    enabled: !!cycleId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['audit-cycles'] });
    qc.invalidateQueries({ queryKey: ['assets'] });
  };

  const assign = useMutation({
    mutationFn: () => auditsService.assignAuditors(cycleId!, auditorIds),
    onSuccess: () => { message.success('Auditors assigned'); setAuditorIds([]); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });
  const start = useMutation({
    mutationFn: () => auditsService.start(cycleId!),
    onSuccess: () => { message.success('Cycle started — items generated'); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });
  const mark = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: 'VERIFIED' | 'MISSING' | 'DAMAGED' }) =>
      auditsService.markItem(itemId, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audit-cycles', cycleId, 'items'] }); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });
  const close = useMutation({
    mutationFn: () => auditsService.close(cycleId!),
    onSuccess: (res) => {
      message.success(res.lostAssetTags.length ? `Closed — ${res.lostAssetTags.length} asset(s) marked LOST` : 'Cycle closed');
      invalidate();
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const inProgress = cycle?.status === 'IN_PROGRESS';
  const canPerform = can(PERMISSION.AUDIT_PERFORM);
  const canManage = can(PERMISSION.AUDIT_MANAGE);

  const itemColumns: TableProps<AuditItem>['columns'] = [
    { title: 'Asset', key: 'asset', render: (_, it) => `${it.asset?.assetTag} — ${it.asset?.name}` },
    { title: 'Result', key: 'status', render: (_, it) => <StatusTag status={it.status} /> },
    {
      title: 'Mark',
      key: 'mark',
      align: 'right',
      render: (_, it) =>
        inProgress && canPerform ? (
          <Space.Compact>
            <Button size="small" onClick={() => mark.mutate({ itemId: it.id, status: 'VERIFIED' })}>Verified</Button>
            <Button size="small" danger onClick={() => mark.mutate({ itemId: it.id, status: 'MISSING' })}>Missing</Button>
            <Button size="small" onClick={() => mark.mutate({ itemId: it.id, status: 'DAMAGED' })}>Damaged</Button>
          </Space.Compact>
        ) : null,
    },
  ];

  return (
    <Drawer open={!!cycleId} onClose={onClose} size={720} title={cycle?.name ?? 'Audit cycle'}>
      {isLoading || !cycle ? (
        <Spin />
      ) : (
        <>
          <WorkflowSteps steps={STEPS} current={cycle.status} />
          <Descriptions column={2} size="small" bordered style={{ marginTop: 16 }}>
            <Descriptions.Item label="Status"><StatusTag status={cycle.status} /></Descriptions.Item>
            <Descriptions.Item label="Scope">{cycle.scopeType}</Descriptions.Item>
            <Descriptions.Item label="Window">{dayjs(cycle.startDate).format('MMM D')} – {dayjs(cycle.endDate).format('MMM D, YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Items">{cycle._count?.items ?? items.length}</Descriptions.Item>
            <Descriptions.Item label="Auditors" span={2}>
              {cycle.auditors?.length ? cycle.auditors.map((a) => <Tag key={a.id}>{a.auditorUser?.name}</Tag>) : <span className="af-muted">None yet</span>}
            </Descriptions.Item>
          </Descriptions>

          {/* PLANNED: assign auditors + start */}
          {cycle.status === 'PLANNED' && canManage && (
            <>
              <Divider titlePlacement="start">Assign auditors & start</Divider>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Select auditors"
                    value={auditorIds}
                    onChange={setAuditorIds}
                    optionFilterProp="label"
                    options={(employees?.items ?? []).map((u) => ({ value: u.id, label: u.name }))}
                  />
                  <Button type="primary" loading={assign.isPending} disabled={!auditorIds.length} onClick={() => assign.mutate()}>Assign</Button>
                </Space.Compact>
                <Popconfirm title="Start the cycle? Audit items will be generated for in-scope assets." onConfirm={() => start.mutate()}>
                  <Button icon={<PlayCircleOutlined />} loading={start.isPending}>Start cycle</Button>
                </Popconfirm>
              </Space>
            </>
          )}

          {/* IN_PROGRESS / CLOSED: items */}
          {cycle.status !== 'PLANNED' && (
            <>
              <Divider titlePlacement="start">Items</Divider>
              {items.length === 0 ? (
                <Empty description="No items" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Table<AuditItem> rowKey="id" size="small" columns={itemColumns} dataSource={items} pagination={{ pageSize: 8, hideOnSinglePage: true }} />
              )}
              {inProgress && canManage && (
                <Popconfirm title="Close & lock the cycle? MISSING assets become LOST." onConfirm={() => close.mutate()}>
                  <Button danger icon={<LockOutlined />} loading={close.isPending} style={{ marginTop: 16 }}>Close cycle</Button>
                </Popconfirm>
              )}
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
