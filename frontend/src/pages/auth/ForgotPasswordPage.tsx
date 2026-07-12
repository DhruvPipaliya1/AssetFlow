import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, App as AntApp, Result } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../../services/auth.service';
import { apiErrorMessage } from '../../services/apiClient';
import { PATHS } from '../../routes/paths';

type Stage = 'request' | 'reset' | 'done';

// Two-step reset. Step 1 requests a token by email; because there's no email
// infrastructure, the backend returns the token in dev so step 2 (set a new
// password) can be completed in-app. Unknown emails resolve without a token.
export default function ForgotPasswordPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('request');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  const requestReset = async (values: { email: string }) => {
    setLoading(true);
    try {
      const { resetToken } = await authService.forgotPassword(values.email);
      if (resetToken) {
        setToken(resetToken);
        setStage('reset');
      } else {
        // No account for that email — show the same generic success (no enumeration).
        setStage('done');
      }
    } catch {
      message.error('Could not process the request');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (values: { password: string }) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, values.password);
      message.success('Password updated — please sign in');
      navigate(PATHS.login);
    } catch (e) {
      message.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'done') {
    return (
      <Result
        status="success"
        title="Check your email"
        subTitle="If an account exists for that email, a reset link is on its way."
        extra={<Link to={PATHS.login}>Back to login</Link>}
      />
    );
  }

  if (stage === 'reset') {
    return (
      <>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Reset link verified"
          description="For this demo the reset link is opened automatically. Choose a new password below."
        />
        <Form layout="vertical" onFinish={submitReset} requiredMark={false} disabled={loading}>
          <Form.Item
            name="password"
            label="New password"
            rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="New password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm password"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || getFieldValue('password') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Passwords do not match')),
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Re-enter password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Set new password
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, textAlign: 'center', marginBottom: 0 }}>
          <Link to={PATHS.login}>Back to login</Link>
        </Typography.Paragraph>
      </>
    );
  }

  return (
    <>
      <Form layout="vertical" onFinish={requestReset} requiredMark={false} disabled={loading}>
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
