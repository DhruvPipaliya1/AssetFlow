import type { ReactNode } from 'react';
import { Card, Button, Spin, Empty } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { reportsService, type ReportName } from '../../../services/reports.service';
import type { ReportRow } from '../../../types/models';

interface Props {
  name: ReportName;
  title: string;
  children: (rows: ReportRow[]) => ReactNode;
}

// A report panel: fetches its rows, renders a chart (via children), and offers a
// CSV export of the exact same server-side dataset.
export function ReportCard({ name, title, children }: Props) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['reports', name],
    queryFn: () => reportsService.rows(name),
  });

  return (
    <Card
      title={title}
      extra={
        <Button icon={<DownloadOutlined />} onClick={() => reportsService.downloadCsv(name)}>
          Export CSV
        </Button>
      }
    >
      {isLoading ? (
        <Spin />
      ) : rows.length === 0 ? (
        <Empty description="No data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        children(rows)
      )}
    </Card>
  );
}
