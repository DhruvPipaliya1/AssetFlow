import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Table, Input, Select, Space, Flex, Tag, Tooltip, type TableProps } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { assetsService, type AssetFilters } from '../../services/assets.service';
import { categoriesService } from '../../services/categories.service';
import { departmentsService } from '../../services/departments.service';
import { StatusTag } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSION } from '../../types/permissions';
import { AssetStatus } from '../../types/enums';
import type { Asset } from '../../types/models';
import { AssetFormModal } from './components/AssetFormModal';
import { AssetDetailDrawer } from './components/AssetDetailDrawer';

const PAGE_SIZE = 10;

export default function AssetsPage() {
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<AssetFilters>({ page: 1, take: PAGE_SIZE });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Deep-link: /assets?asset=<id> (from the command palette) opens its detail.
  const assetParam = searchParams.get('asset');
  useEffect(() => {
    if (assetParam) setDetailId(assetParam);
  }, [assetParam]);

  const closeDetail = () => {
    setDetailId(null);
    if (searchParams.has('asset')) {
      searchParams.delete('asset');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesService.list });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: departmentsService.list });
  const { data, isFetching } = useQuery({
    queryKey: ['assets', filters],
    queryFn: () => assetsService.list(filters),
    placeholderData: keepPreviousData,
  });

  const patch = (p: Partial<AssetFilters>) => setFilters((f) => ({ ...f, ...p, page: 1 }));

  const columns: TableProps<Asset>['columns'] = [
    { title: 'Tag', dataIndex: 'assetTag', key: 'assetTag', render: (t) => <Tag icon={<QrcodeOutlined />}>{t}</Tag> },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', key: 'category', render: (_, a) => a.category?.name ?? '—' },
    { title: 'Status', key: 'status', render: (_, a) => <StatusTag status={a.status} /> },
    { title: 'Location', dataIndex: 'location', key: 'location', render: (l) => l ?? <span className="af-muted">—</span> },
    { title: 'Held by', key: 'holder', render: (_, a) => a.currentHolderUser?.name ?? <span className="af-muted">—</span> },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, a) => (
        <Space onClick={(e) => e.stopPropagation()}>
          {can(PERMISSION.ASSET_REGISTER) && (
            <Tooltip title="Edit">
              <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(a); setFormOpen(true); }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 16 }}>
        <Space wrap>
          <Tooltip title="Search by asset tag (from a scanned QR), name or serial number">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search tag / QR / name / serial"
              style={{ width: 260 }}
              onChange={(e) => patch({ q: e.target.value.trim() || undefined })}
            />
          </Tooltip>
          <Select
            allowClear
            placeholder="Category"
            style={{ width: 160 }}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(v) => patch({ categoryId: v })}
          />
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 170 }}
            options={Object.values(AssetStatus).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
            onChange={(v) => patch({ status: v })}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Department"
            style={{ width: 170 }}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            onChange={(v) => patch({ ownerDepartmentId: v })}
          />
          <Select
            allowClear
            placeholder="Bookable"
            style={{ width: 130 }}
            options={[{ value: 'true', label: 'Bookable' }, { value: 'false', label: 'Not bookable' }]}
            onChange={(v) => patch({ isBookable: v })}
          />
        </Space>
        {can(PERMISSION.ASSET_REGISTER) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Register asset
          </Button>
        )}
      </Flex>

      <Table<Asset>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={data?.items ?? []}
        onRow={(a) => ({ onClick: () => setDetailId(a.id), style: { cursor: 'pointer' } })}
        pagination={{
          current: filters.page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          showSizeChanger: false,
          onChange: (page) => setFilters((f) => ({ ...f, page })),
        }}
      />

      <AssetFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSaved={() => undefined} />
      <AssetDetailDrawer assetId={detailId} onClose={closeDetail} />
    </div>
  );
}
