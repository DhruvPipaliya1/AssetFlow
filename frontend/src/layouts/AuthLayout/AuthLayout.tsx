import { Outlet } from 'react-router-dom';
import { Layout, Card, Typography, theme } from 'antd';
import { APP_NAME, APP_TAGLINE } from '../../config/constants';
import './AuthLayout.css';

// Centered card shell for the auth pages (login/signup/forgot).
export function AuthLayout() {
  const { token } = theme.useToken();

  return (
    <Layout className="af-auth" style={{ minHeight: '100vh' }}>
      <div className="af-auth__wrap">
        <Card className="af-auth__card" style={{ boxShadow: token.boxShadowSecondary }}>
          <div className="af-auth__brand">
            <Typography.Title level={2} style={{ margin: 0, color: token.colorPrimary }}>
              {APP_NAME}
            </Typography.Title>
            <Typography.Text type="secondary">{APP_TAGLINE}</Typography.Text>
          </div>
          <Outlet />
        </Card>
      </div>
    </Layout>
  );
}
