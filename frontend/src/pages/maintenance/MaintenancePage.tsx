import { useState } from 'react';
import { App, Button, Table, Select, Flex, Space, Popconfirm, Tag, Modal, type TableProps } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, PlayCircleOutlined, CheckCircleOutlined, UserAddOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { maintenanceService, type MaintenanceFilters } from '../../services/maintenance.service';
import { employeesService } from '../../services/employees.service';
import { apiErrorMessage } from '../../services/apiClient';
import { StatusTag, WorkflowSteps } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSION } from '../../types/permissions';
import { MaintenanceStatus, Priority } from '../../types/enums';
import type { MaintenanceRequest } from '../../types/models';
import { RaiseMaintenanceModal } from './components/RaiseMaintenanceModal';

const PAGE_SIZE = 10;
const STEPS = [
  { key: 'PENDING', title: 'Pending' },
  { key: 'APPROVED', title: 'Approved' },
  { key: 'TECH_ASSIGNED', title: 'Tech assigned' },
  { key: 'IN_PROGRESS', title: 'In progress' },
  { key: 'RESOLVED', title: 'Resolved' },
];
const PRIORITY_COLOR: Record<string, string> = { LOW: 'default', MEDIUM: 'blue', HIGH: 'orange', CRITICAL: 'red' };

type WorkStatus = 'TECH_ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

export default function MaintenancePage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { message } = App.useApp();
  const [filters, setFilters] = useState<MaintenanceFilters>({ page: 1, take: PAGE_SIZE });
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<MaintenanceRequest | null>(null);
  const [techId, setTechId] = useState<string | undefined>(undefined);

  const { data, isFetching } = useQuery({
    queryKey: ['maintenance', filters],
    queryFn: () => maintenanceService.list(filters),
    placeholderData: keepPreviousData,
  });

  const canApprove = can(PERMISSION.MAINTENANCE_APPROVE);
  const { data: employees } = useQuery({
    queryKey: ['employees', 'technicians'],
    queryFn: () => employeesService.list({ take: '100', status: 'ACTIVE' }),
    enabled: canApprove,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['maintenance'] });
    qc.invalidateQueries({ queryKey: ['assets'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'APPROVE' | 'REJECT' }) => maintenanceService.decide(id, decision),
    onSuccess: (_, { decision }) => { message.success(`Request ${decision === 'APPROVE' ? 'approved' : 'rejected'}`); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });
  const advance = useMutation({
    mutationFn: ({ id, status, technicianUserId }: { id: string; status: WorkStatus; technicianUserId?: string }) =>
      maintenanceService.setStatus(id, status, technicianUserId),
    onSuccess: () => { message.success('Status updated'); setAssignFor(null); setTechId(undefined); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const columns: TableProps<MaintenanceRequest>['columns'] = [
    { title: 'Asset', key: 'asset', render: (_, m) => `${m.asset?.assetTag} — ${m.asset?.name}` },
    { title: 'Issue', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Priority', key: 'priority', render: (_, m) => <Tag color={PRIORITY_COLOR[m.priority]}>{m.priority}</Tag> },
    { title: 'Raised by', key: 'by', render: (_, m) => m.raisedByUser?.name ?? '—' },
    { title: 'Technician', key: 'tech', render: (_, m) => m.technicianUser?.name ?? <span className="af-muted">—</span> },
    { title: 'Status', key: 'status', render: (_, m) => <StatusTag status={m.status} /> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, m) => {
        if (!canApprove) return null;
        if (m.status === 'PENDING')
          return (
            <Space>
              <Popconfirm title="Approve? Asset → Under maintenance" onConfirm={() => decide.mutate({ id: m.id, decision: 'APPROVE' })}>
                <Button size="small" type="primary" icon={<CheckOutlined />}>Approve</Button>
              </Popconfirm>
              <Popconfirm title="Reject this request?" onConfirm={() => decide.mutate({ id: m.id, decision: 'REJECT' })}>
                <Button size="small" danger icon={<CloseOutlined />}>Reject</Button>
              </Popconfirm>
            </Space>
          );
        if (m.status === 'APPROVED')
          return (
            <Button size="small" icon={<UserAddOutlined />} onClick={() => { setAssignFor(m); setTechId(m.technicianUserId ?? undefined); }}>
              Assign technician
            </Button>
          );
        if (m.status === 'TECH_ASSIGNED')
          return <Button size="small" icon={<PlayCircleOutlined />} onClick={() => advance.mutate({ id: m.id, status: 'IN_PROGRESS' })}>Start work</Button>;
        if (m.status === 'IN_PROGRESS')
          return (
            <Popconfirm title="Mark resolved? Asset → Available" onConfirm={() => advance.mutate({ id: m.id, status: 'RESOLVED' })}>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Resolve</Button>
            </Popconfirm>
          );
        return null;
      },
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select allowClear placeholder="Status" style={{ width: 170 }}
            options={Object.values(MaintenanceStatus).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
            onChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))} />
          <Select allowClear placeholder="Priority" style={{ width: 140 }}
            options={Object.values(Priority).map((p) => ({ value: p, label: p }))}
            onChange={(v) => setFilters((f) => ({ ...f, priority: v, page: 1 }))} />
        </Space>
        {can(PERMISSION.MAINTENANCE_RAISE) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRaiseOpen(true)}>Raise request</Button>
        )}
      </Flex>

      <Table<MaintenanceRequest>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={data?.items ?? []}
        expandable={{
          expandedRowRender: (m) => <WorkflowSteps steps={STEPS} current={m.status} error={m.status === 'REJECTED'} />,
        }}
        pagination={{
          current: filters.page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => setFilters((f) => ({ ...f, page })),
        }}
      />

      <RaiseMaintenanceModal open={raiseOpen} onClose={() => setRaiseOpen(false)} />

      <Modal
        open={!!assignFor}
        title="Assign technician"
        okText="Assign"
        onOk={() => assignFor && techId && advance.mutate({ id: assignFor.id, status: 'TECH_ASSIGNED', technicianUserId: techId })}
        okButtonProps={{ disabled: !techId, loading: advance.isPending }}
        onCancel={() => { setAssignFor(null); setTechId(undefined); }}
        destroyOnHidden
      >
        <p>Assign a technician to <strong>{assignFor?.asset?.assetTag}</strong>. The request moves to <em>Tech assigned</em>.</p>
        <Select
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          placeholder="Select a technician"
          value={techId}
          onChange={setTechId}
          options={(employees?.items ?? []).map((u) => ({ value: u.id, label: `${u.name} · ${u.role.replace(/_/g, ' ')}` }))}
        />
      </Modal>
    </div>
  );
}
