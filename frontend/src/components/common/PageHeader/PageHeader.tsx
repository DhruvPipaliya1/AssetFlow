import type { ReactNode } from 'react';
import { Flex, Typography } from 'antd';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode; // buttons on the right
}

// Consistent page title bar used at the top of every page.
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="center" wrap gap={12} style={{ marginBottom: 24 }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
      </div>
      {actions && <Flex gap={8}>{actions}</Flex>}
    </Flex>
  );
}
