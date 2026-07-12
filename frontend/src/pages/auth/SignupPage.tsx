import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, App as AntApp, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { apiErrorMessage } from '../../services/apiClient';
import { PATHS } from '../../routes/paths';

interface SignupForm {
  name: string;
  email: string;
  password: string;
}

// NOTE: no role field — signup ALWAYS creates an Employee (Golden Invariant #1).
export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: SignupForm) => {
    setLoading(true);
    try {
      await signup(values.name, values.email, values.password);
      navigate(PATHS.dashboard, { replace: true });
    } catch (err) {
      message.error(apiErrorMessage(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="New accounts start as Employee. An Admin can promote you later."
      />
      <Form<SignupForm> layout="vertical" onFinish={onFinish} requiredMark={false} disabled={loading}>
        <Form.Item name="name" label="Full name" rules={[{ required: true }]}>
          <Input prefix={<UserOutlined />} placeholder="Jane Doe" autoComplete="name" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input prefix={<MailOutlined />} placeholder="you@company.com" autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="At least 8 characters" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Create account
        </Button>
      </Form>
      <Typography.Paragraph style={{ marginTop: 16, textAlign: 'center', marginBottom: 0 }}>
        Already have an account? <Link to={PATHS.login}>Log in</Link>
      </Typography.Paragraph>
    </>
  );
}
