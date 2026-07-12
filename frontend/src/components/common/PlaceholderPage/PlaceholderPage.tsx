import { Card, Empty } from 'antd';
import { PageHeader } from '../PageHeader/PageHeader';

export interface PlaceholderPageProps {
  title: string;
  description?: string;
}

// Temporary page for screens not yet built — keeps routing/nav functional so
// the shell is fully navigable before every feature lands.
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={description} />
      <Card>
        <Empty description={`${title} — coming soon`} />
      </Card>
    </div>
  );
}
