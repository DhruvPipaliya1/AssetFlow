import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, App as AntApp } from 'antd';
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

  const from = (location.state as { from?: Location })?.from?.pathname ?? PATHS.dashboard;

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      message.error(apiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form<LoginForm> layout="vertical" onFinish={onFinish} requiredMark={false} disabled={loading}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input prefix={<MailOutlined />} placeholder="you@company.com" autoComplete="email" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Log in
        </Button>
      </Form>
      <Typography.Paragraph style={{ marginTop: 16, textAlign: 'center' }}>
        <Link to={PATHS.forgotPassword}>Forgot password?</Link>
      </Typography.Paragraph>
      <Typography.Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
        No account? <Link to={PATHS.signup}>Sign up</Link>
      </Typography.Paragraph>
    </>
  );
}
