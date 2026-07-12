import { useState } from 'react';
import { App, Button, Flex, Space, Table, Tag, Tooltip, type TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsService } from '../../../services/departments.service';
import { apiErrorMessage } from '../../../services/apiClient';
import { StatusTag } from '../../../components/common';
import type { Department } from '../../../types/models';
import { DepartmentFormModal } from './DepartmentFormModal';

export function DepartmentsTab() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsService.list,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['departments'] });

  const deactivate = useMutation({
    mutationFn: (id: string) => departmentsService.deactivate(id),
    onSuccess: () => { message.success('Department deactivated'); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });
  const activate = useMutation({
    mutationFn: (id: string) => departmentsService.update(id, { status: 'ACTIVE' }),
    onSuccess: () => { message.success('Department activated'); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (d: Department) => { setEditing(d); setOpen(true); };

  const columns: TableProps<Department>['columns'] = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Head', key: 'head', render: (_, d) => d.headUser?.name ?? <span className="af-muted">—</span> },
    { title: 'Parent', key: 'parent', render: (_, d) => d.parentDepartment?.name ?? <span className="af-muted">—</span> },
    { title: 'Members', key: 'members', align: 'center', render: (_, d) => <Tag>{d._count?.members ?? 0}</Tag> },
    { title: 'Status', key: 'status', render: (_, d) => <StatusTag status={d.status} /> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, d) => (
        <Space>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(d)} />
          </Tooltip>
          {d.status === 'ACTIVE' ? (
            <Tooltip title="Deactivate">
              <Button size="small" danger icon={<StopOutlined />} loading={deactivate.isPending} onClick={() => deactivate.mutate(d.id)} />
            </Tooltip>
          ) : (
            <Tooltip title="Activate">
              <Button size="small" icon={<CheckCircleOutlined />} loading={activate.isPending} onClick={() => activate.mutate(d.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="flex-end" style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Department
        </Button>
      </Flex>
      <Table<Department>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={departments}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />
      <DepartmentFormModal open={open} editing={editing} onClose={() => setOpen(false)} onSaved={invalidate} />
    </div>
  );
}
