import { Tabs } from 'antd';
import { SwapOutlined, RetweetOutlined } from '@ant-design/icons';
import { AllocationsTab } from './components/AllocationsTab';
import { TransfersTab } from './components/TransfersTab';

export default function AllocationsPage() {
  return (
    <Tabs
      defaultActiveKey="allocations"
      items={[
        {
          key: 'allocations',
          label: (<span><SwapOutlined /> Allocations</span>),
          children: <AllocationsTab />,
        },
        {
          key: 'transfers',
          label: (<span><RetweetOutlined /> Transfers</span>),
          children: <TransfersTab />,
        },
      ]}
    />
  );
}
