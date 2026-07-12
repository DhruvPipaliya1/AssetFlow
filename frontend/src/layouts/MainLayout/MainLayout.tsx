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
  Flex,
  Typography,
  Tooltip,
  List,
  Empty,
  type MenuProps,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
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
import { useSocketNotifications } from '../../hooks/useSocketNotifications';
import { navItemsForUser } from '../../config/navigation';
import { getPageMeta } from '../../config/pageMeta';
import { notificationsService } from '../../services/notifications.service';
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
  const pageMeta = getPageMeta(location.pathname);

  // Live notifications: connect the socket + toast, and keep the bell fresh.
  useSocketNotifications();
  const { data: notif } = useQuery({
    queryKey: ['notifications', { take: 6 }],
    queryFn: () => notificationsService.list({ take: 6 }),
    refetchInterval: 60_000,
  });

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
          <Flex align="center" style={{ minWidth: 0 }}>
            <Button
              type="text"
              aria-label="Toggle sidebar"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 64, height: 64 }}
            />
            <div className="af-page-title">
              <span className="af-page-title__main">{pageMeta.title}</span>
              {pageMeta.subtitle && <span className="af-page-title__sub">{pageMeta.subtitle}</span>}
            </div>
          </Flex>
          <Space size="middle" style={{ paddingRight: 16 }}>
            <Tooltip title="Toggle theme">
              <Button type="text" aria-label="Toggle theme" icon={<BulbOutlined />} onClick={toggle} />
            </Tooltip>
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              popupRender={() => (
                <div style={{ width: 320, background: colorBgContainer, borderRadius: 8, boxShadow: 'var(--af-shadow-lg, 0 6px 24px rgba(0,0,0,0.15))', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', fontWeight: 600, borderBottom: '1px solid var(--af-border)' }}>Notifications</div>
                  {notif?.items.length ? (
                    <List
                      dataSource={notif.items}
                      renderItem={(n) => (
                        <List.Item style={{ padding: '8px 12px' }}>
                          <List.Item.Meta
                            title={<Typography.Text strong={!n.isRead} style={{ fontSize: 13 }}>{n.message}</Typography.Text>}
                            description={<Typography.Text type="secondary" style={{ fontSize: 11 }}>{dayjs(n.createdAt).format('MMM D, HH:mm')}</Typography.Text>}
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty style={{ padding: 16 }} image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" />
                  )}
                  <div style={{ padding: 8, textAlign: 'center', borderTop: '1px solid var(--af-border)' }}>
                    <Button type="link" size="small" onClick={() => navigate(PATHS.notifications)}>View all</Button>
                  </div>
                </div>
              )}
            >
              <Badge count={notif?.unreadCount ?? 0} size="small">
                <Button type="text" aria-label="Notifications" icon={<BellOutlined />} />
              </Badge>
            </Dropdown>
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
