import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Divider, App as AntApp } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { apiErrorMessage } from '../../services/apiClient';
import { PATHS } from '../../routes/paths';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();
  const [loading, setLoading] = useState(false);

  const explicitFrom = (location.state as { from?: Location })?.from?.pathname;

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const user = await login(values.email, values.password);
      // Honour where they were headed, else their saved landing-page preference.
      navigate(explicitFrom ?? user.preferences?.landingPath ?? PATHS.dashboard, { replace: true });
    } catch (err) {
      message.error(apiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          Welcome back
        </Typography.Title>
        <Typography.Text type="secondary">Sign in to continue to your AssetFlow workspace.</Typography.Text>
      </div>

      <Form<LoginForm> layout="vertical" size="large" onFinish={onFinish} requiredMark={false} disabled={loading}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
          <Input prefix={<MailOutlined />} placeholder="you@company.com" autoComplete="email" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password' }]} style={{ marginBottom: 8 }}>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" />
        </Form.Item>
        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <Link to={PATHS.forgotPassword}>Forgot password?</Link>
        </div>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Log in
        </Button>
      </Form>

      <Divider plain style={{ marginTop: 24, marginBottom: 16, color: 'var(--af-text-muted)' }}>
        New here?
      </Divider>
      <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 12, fontSize: 13 }}>
        Signing up creates an employee account — admin assigns elevated roles later.
      </Typography.Paragraph>
      <Link to={PATHS.signup}>
        <Button block>Create an account</Button>
      </Link>
    </>
  );
}
