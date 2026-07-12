import { Card, Empty } from 'antd';

export interface PlaceholderPageProps {
  title: string;
  description?: string;
}

// Temporary page for screens not yet built. The page title lives in the top
// header (config/pageMeta.ts); this just shows a "coming soon" placeholder.
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card>
      <Empty description={description ?? `${title} — coming soon`} />
    </Card>
  );
}
