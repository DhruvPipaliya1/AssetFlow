import { useEffect, useMemo, useState } from 'react';
import { App, Table, Checkbox, Button, Space, Typography, Tag, Alert, Spin, type TableProps } from 'antd';
import { LockOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rbacService, type PermissionMeta } from '../../services/rbac.service';
import { apiErrorMessage } from '../../services/apiClient';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  ASSET_MANAGER: 'Asset Manager',
  DEPARTMENT_HEAD: 'Dept Head',
  EMPLOYEE: 'Employee',
};

const setEq = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));

// Super-admin permission matrix. Admin edits what each non-admin role may do;
// the Admin column and governance permissions are locked (no lockout possible).
export default function AccessControlPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { data, isLoading } = useQuery({ queryKey: ['rbac-matrix'], queryFn: rbacService.matrix });
  const [draft, setDraft] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    if (!data) return;
    const next: Record<string, Set<string>> = {};
    for (const r of data.roles) next[r] = new Set(data.grants[r] ?? []);
    setDraft(next);
  }, [data]);

  const editableRoles = useMemo(() => (data?.roles ?? []).filter((r) => r !== 'ADMIN'), [data]);

  const dirtyRoles = useMemo(() => {
    if (!data) return [];
    return editableRoles.filter((r) => !setEq(draft[r] ?? new Set(), new Set(data.grants[r] ?? [])));
  }, [data, draft, editableRoles]);

  const toggle = (role: string, perm: string) =>
    setDraft((prev) => {
      const set = new Set(prev[role] ?? []);
      set.has(perm) ? set.delete(perm) : set.add(perm);
      return { ...prev, [role]: set };
    });

  const reset = () => {
    if (!data) return;
    const next: Record<string, Set<string>> = {};
    for (const r of data.roles) next[r] = new Set(data.grants[r] ?? []);
    setDraft(next);
  };

  const save = useMutation({
    mutationFn: async () => {
      for (const role of dirtyRoles) await rbacService.setRole(role, [...(draft[role] ?? [])]);
      return dirtyRoles;
    },
    onSuccess: (roles) => {
      message.success(`Updated ${roles.length} role${roles.length === 1 ? '' : 's'}`);
      qc.invalidateQueries({ queryKey: ['rbac-matrix'] });
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  if (isLoading || !data) return <Spin />;

  const roleColumn = (role: string): NonNullable<TableProps<PermissionMeta>['columns']>[number] => ({
    title: (
      <div style={{ textAlign: 'center' }}>
        {ROLE_LABEL[role] ?? role}
        {role === 'ADMIN' && <div><Tag color="gold" style={{ marginTop: 4 }}>Super-admin</Tag></div>}
      </div>
    ),
    key: role,
    align: 'center',
    width: 130,
    render: (_: unknown, p: PermissionMeta) => {
      const isAdmin = role === 'ADMIN';
      const checked = isAdmin ? true : p.locked ? false : draft[role]?.has(p.key) ?? false;
      const disabled = isAdmin || p.locked;
      return <Checkbox checked={checked} disabled={disabled} onChange={() => toggle(role, p.key)} />;
    },
  });

  const columns: TableProps<PermissionMeta>['columns'] = [
    {
      title: 'Permission',
      key: 'perm',
      render: (_, p) => (
        <div>
          <Space size={6}>
            <Typography.Text strong>{p.label}</Typography.Text>
            {p.locked && <LockOutlined style={{ color: 'var(--af-text-secondary, #999)' }} />}
          </Space>
          <div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{p.description}</Typography.Text></div>
        </div>
      ),
    },
    { title: 'Area', dataIndex: 'category', key: 'category', width: 120, render: (c) => <Tag bordered={false}>{c}</Tag> },
    ...data.roles.map(roleColumn),
  ];

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Role permissions"
        description={
          <>
            Toggle what each role can do — changes apply to users on their next sign-in.{' '}
            <LockOutlined /> permissions are governance rights, locked to the Admin (super-admin) so no one can be
            locked out. Golden workflow rules (employee-only signup, no double-allocation, booking overlap,
            maintenance approval) are enforced structurally and are never affected by this matrix.
          </>
        }
      />

      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<SaveOutlined />} disabled={!dirtyRoles.length} loading={save.isPending} onClick={() => save.mutate()}>
          Save changes{dirtyRoles.length ? ` (${dirtyRoles.length})` : ''}
        </Button>
        <Button icon={<ReloadOutlined />} disabled={!dirtyRoles.length || save.isPending} onClick={reset}>
          Reset
        </Button>
      </Space>

      <Table<PermissionMeta>
        rowKey="key"
        columns={columns}
        dataSource={[...data.permissions].sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label))}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
