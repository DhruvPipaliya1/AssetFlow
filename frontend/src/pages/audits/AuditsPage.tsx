import { useState } from 'react';
import { Button, Table, Flex, Tag, type TableProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { auditsService } from '../../services/audits.service';
import { StatusTag } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSION } from '../../types/permissions';
import type { AuditCycle } from '../../types/models';
import { CreateCycleModal } from './components/CreateCycleModal';
import { CycleDetailDrawer } from './components/CycleDetailDrawer';

export default function AuditsPage() {
  const { can } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['audit-cycles'],
    queryFn: () => auditsService.listCycles(),
  });

  const columns: TableProps<AuditCycle>['columns'] = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Scope', key: 'scope', render: (_, c) => <Tag>{c.scopeType}</Tag> },
    { title: 'Window', key: 'window', render: (_, c) => `${dayjs(c.startDate).format('MMM D')} – ${dayjs(c.endDate).format('MMM D, YYYY')}` },
    { title: 'Items', key: 'items', align: 'center', render: (_, c) => c._count?.items ?? 0 },
    { title: 'Status', key: 'status', render: (_, c) => <StatusTag status={c.status} /> },
  ];

  return (
    <div>
      <Flex justify="flex-end" style={{ marginBottom: 16 }}>
        {can(PERMISSION.AUDIT_MANAGE) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Create cycle
          </Button>
        )}
      </Flex>

      <Table<AuditCycle>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={data?.items ?? []}
        onRow={(c) => ({ onClick: () => setDetailId(c.id), style: { cursor: 'pointer' } })}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />

      <CreateCycleModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <CycleDetailDrawer cycleId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
