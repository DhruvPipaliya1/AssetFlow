import { Card, Table, Tag, Spin } from 'antd';
import type { DepartmentSummaryDataPoint } from '../../../types/models';

interface DepartmentSummaryChartProps {
  data: DepartmentSummaryDataPoint[];
  loading?: boolean;
}

type ColumnAlign = 'left' | 'center' | 'right';

const columns: Array<{ title: string; dataIndex: string; key: string; width: number; align?: ColumnAlign; render?: (value: number) => React.ReactNode }> = [
  {
    title: 'Department',
    dataIndex: 'department',
    key: 'department',
    width: 180,
  },
  {
    title: 'Total Assets',
    dataIndex: 'totalAssets',
    key: 'totalAssets',
    align: 'center',
    width: 110,
  },
  {
    title: 'Allocated',
    dataIndex: 'allocatedAssets',
    key: 'allocatedAssets',
    align: 'center',
    width: 100,
  },
  {
    title: 'Available',
    dataIndex: 'availableAssets',
    key: 'availableAssets',
    align: 'center',
    width: 100,
  },
  {
    title: 'Under Maintenance',
    dataIndex: 'maintenanceAssets',
    key: 'maintenanceAssets',
    align: 'center',
    width: 130,
  },
  {
    title: 'Utilization Rate',
    dataIndex: 'utilizationRate',
    key: 'utilizationRate',
    align: 'center',
    width: 130,
    render: (value: number) => (
      <Tag color={value > 0.8 ? 'red' : value > 0.5 ? 'orange' : 'green'}>
        {(value * 100).toFixed(1)}%
      </Tag>
    ),
  },
];

export function DepartmentSummaryChart({ data, loading }: DepartmentSummaryChartProps) {
  if (loading) {
    return (
      <Card title="Department Asset Summary">
        <Spin size="large" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card title="Department Asset Summary">
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          No department data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Department Asset Summary">
      <Table
        dataSource={data}
        columns={columns}
        pagination={false}
        size="middle"
        rowKey="department"
        bordered
      />
      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        <strong>Utilization Rate</strong> = Allocated / Total Assets.
        Green = <span style={{ color: '#52c41a' }}>healthy</span>,
        Orange = <span style={{ color: '#faad14' }}>moderate</span>,
        Red = <span style={{ color: '#ff4d4f' }}>high utilization</span>.
      </div>
    </Card>
  );
}