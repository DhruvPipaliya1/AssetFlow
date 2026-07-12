import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  theme,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Typography,
  Tooltip,
  type MenuProps,
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  BulbOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../context/ThemeContext';
import { navItemsForUser } from '../../config/navigation';
import { PATHS } from '../../routes/paths';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

// App shell — collapsible dark sider (custom trigger), header with theme
// toggle + notifications + user menu, and the routed page in Content.
export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { user, logout } = useAuth();
  const { toggle } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuProps['items'] = navItemsForUser(user!).map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  }));

  const userMenu: MenuProps = {
    items: [
      { key: 'name', label: user?.name, disabled: true },
      { key: 'role', label: <Typography.Text type="secondary">{user?.role}</Typography.Text>, disabled: true },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') logout();
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" className="af-sider">
        <div className="af-logo">{collapsed ? 'AF' : 'AssetFlow'}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none', background: 'transparent' }}
        />
      </Sider>
      <Layout>
        <Header className="af-header" style={{ background: colorBgContainer }}>
          <Button
            type="text"
            aria-label="Toggle sidebar"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
          <Space size="middle" style={{ paddingRight: 16 }}>
            <Tooltip title="Toggle theme">
              <Button type="text" aria-label="Toggle theme" icon={<BulbOutlined />} onClick={toggle} />
            </Tooltip>
            <Badge count={0} size="small">
              <Button
                type="text"
                aria-label="Notifications"
                icon={<BellOutlined />}
                onClick={() => navigate(PATHS.notifications)}
              />
            </Badge>
            <Dropdown menu={userMenu} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <Typography.Text>{user?.name}</Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
