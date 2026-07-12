import { useState } from 'react';
import { App, Button, Flex, Space, Table, Tag, Tooltip, type TableProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '../../../services/categories.service';
import { apiErrorMessage } from '../../../services/apiClient';
import { StatusTag } from '../../../components/common';
import type { AssetCategory } from '../../../types/models';
import { CategoryFormModal } from './CategoryFormModal';

export function CategoriesTab() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AssetCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.list,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });

  const deactivate = useMutation({
    mutationFn: (id: string) => categoriesService.deactivate(id),
    onSuccess: () => { message.success('Category deactivated'); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });
  const activate = useMutation({
    mutationFn: (id: string) => categoriesService.update(id, { status: 'ACTIVE' }),
    onSuccess: () => { message.success('Category activated'); invalidate(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const columns: TableProps<AssetCategory>['columns'] = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    {
      title: 'Custom Fields',
      key: 'fields',
      render: (_, c) =>
        c.customFields?.length ? (
          <Space size={4} wrap>
            {c.customFields.map((f) => (
              <Tag key={f.key} bordered={false}>{f.label}</Tag>
            ))}
          </Space>
        ) : (
          <span className="af-muted">—</span>
        ),
    },
    { title: 'Assets', key: 'assets', align: 'center', render: (_, c) => <Tag>{c._count?.assets ?? 0}</Tag> },
    { title: 'Status', key: 'status', render: (_, c) => <StatusTag status={c.status} /> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, c) => (
        <Space>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(c); setOpen(true); }} />
          </Tooltip>
          {c.status === 'ACTIVE' ? (
            <Tooltip title="Deactivate">
              <Button size="small" danger icon={<StopOutlined />} loading={deactivate.isPending} onClick={() => deactivate.mutate(c.id)} />
            </Tooltip>
          ) : (
            <Tooltip title="Activate">
              <Button size="small" icon={<CheckCircleOutlined />} loading={activate.isPending} onClick={() => activate.mutate(c.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="flex-end" style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>
          Add Category
        </Button>
      </Flex>
      <Table<AssetCategory>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={categories}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />
      <CategoryFormModal open={open} editing={editing} onClose={() => setOpen(false)} onSaved={invalidate} />
    </div>
  );
}
