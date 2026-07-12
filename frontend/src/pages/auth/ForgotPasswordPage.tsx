import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Typography, App as AntApp, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { authService } from '../../services/auth.service';
import { PATHS } from '../../routes/paths';

export default function ForgotPasswordPage() {
  const { message } = AntApp.useApp();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(values.email);
      setSent(true);
    } catch {
      message.error('Could not process the request');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Result
        status="success"
        title="Check your email"
        subTitle="If an account exists for that email, a reset link is on its way."
        extra={<Link to={PATHS.login}>Back to login</Link>}
      />
    );
  }

  return (
    <>
      <Form layout="vertical" onFinish={onFinish} requiredMark={false} disabled={loading}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input prefix={<MailOutlined />} placeholder="you@company.com" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Send reset link
        </Button>
      </Form>
      <Typography.Paragraph style={{ marginTop: 16, textAlign: 'center', marginBottom: 0 }}>
        <Link to={PATHS.login}>Back to login</Link>
      </Typography.Paragraph>
    </>
  );
}
