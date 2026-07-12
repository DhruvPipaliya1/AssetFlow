import { Flex, Spin, Typography } from 'antd';

export interface LoaderProps {
  tip?: string;
  minHeight?: number | string;
}

// Centered spinner for loading states.
export function Loader({ tip, minHeight = 240 }: LoaderProps) {
  return (
    <Flex vertical align="center" justify="center" gap={12} style={{ minHeight }}>
      <Spin size="large" />
      {tip && <Typography.Text type="secondary">{tip}</Typography.Text>}
    </Flex>
  );
}
