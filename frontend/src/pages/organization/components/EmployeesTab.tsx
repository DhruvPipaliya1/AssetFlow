import { useState } from 'react';
import { App, Button, Flex, Input, Select, Table, Tooltip, Typography, type TableProps } from 'antd';
import { StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesService } from '../../../services/employees.service';
import { departmentsService } from '../../../services/departments.service';
import { apiErrorMessage } from '../../../services/apiClient';
import { StatusTag } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import type { Employee } from '../../../types/models';
import type { Role } from '../../../types/enums';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'ASSET_MANAGER', label: 'Asset Manager' },
  { value: 'DEPARTMENT_HEAD', label: 'Department Head' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

export function EmployeesTab() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { user } = useAuth();
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employees', 'directory', q],
    queryFn: () => employeesService.list({ take: '100', q: q || undefined }),
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsService.list,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['employees'] });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => employeesService.changeRole(id, role),
    onSuccess: (emp) => { message.success(`${emp.name} is now ${emp.role.replace(/_/g, ' ')}`); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });
  const updateEmp = useMutation({
    mutationFn: ({ id, ...data }: { id: string; departmentId?: string | null; status?: 'ACTIVE' | 'INACTIVE' }) =>
      employeesService.update(id, data),
    onSuccess: () => { message.success('Employee updated'); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const deptOptions = [
    { value: '', label: 'Unassigned' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const columns: TableProps<Employee>['columns'] = [
    {
      title: 'Name',
      key: 'name',
      render: (_, e) => (
        <div>
          <div>{e.name}{e.id === user?.id && <Typography.Text type="secondary"> (you)</Typography.Text>}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{e.email}</Typography.Text>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Department',
      key: 'department',
      width: 200,
      render: (_, e) => (
        <Select
          size="small"
          style={{ width: 180 }}
          value={e.departmentId ?? ''}
          options={deptOptions}
          onChange={(val) => updateEmp.mutate({ id: e.id, departmentId: val || null })}
        />
      ),
    },
    {
      title: 'Role',
      key: 'role',
      width: 190,
      render: (_, e) => (
        <Tooltip title={e.id === user?.id ? "You can't change your own role" : ''}>
          <Select
            size="small"
            style={{ width: 170 }}
            value={e.role}
            options={ROLE_OPTIONS}
            disabled={e.id === user?.id}
            onChange={(role) => changeRole.mutate({ id: e.id, role })}
          />
        </Tooltip>
      ),
    },
    { title: 'Status', key: 'status', render: (_, e) => <StatusTag status={e.status} /> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, e) =>
        e.status === 'ACTIVE' ? (
          <Tooltip title="Deactivate">
            <Button size="small" danger icon={<StopOutlined />} disabled={e.id === user?.id} onClick={() => updateEmp.mutate({ id: e.id, status: 'INACTIVE' })} />
          </Tooltip>
        ) : (
          <Tooltip title="Activate">
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => updateEmp.mutate({ id: e.id, status: 'ACTIVE' })} />
          </Tooltip>
        ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }} gap={12} wrap>
        <Input.Search
          placeholder="Search name or email"
          allowClear
          onSearch={setQ}
          style={{ maxWidth: 320 }}
        />
        <Typography.Text type="secondary">{data?.total ?? 0} employees</Typography.Text>
      </Flex>
      <Table<Employee>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />
    </div>
  );
}
