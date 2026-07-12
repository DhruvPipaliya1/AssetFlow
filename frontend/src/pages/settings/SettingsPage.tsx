import { useState, type ReactNode } from 'react';
import {
  App,
  Tabs,
  Card,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Space,
  Select,
  Typography,
  Descriptions,
  Row,
  Col,
} from 'antd';
import { UserOutlined, UploadOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { apiErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../context/ThemeContext';
import { PERMISSION } from '../../types/permissions';
import { PATHS } from '../../routes/paths';
import type { ThemeMode } from '../../styles/theme';
import AccessControlPanel from '../access/AccessControlPage';

const MAX_AVATAR_BYTES = 512 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const LANDING_OPTIONS = [
  { value: PATHS.dashboard, label: 'Dashboard' },
  { value: PATHS.assets, label: 'Assets' },
  { value: PATHS.allocations, label: 'Allocations' },
  { value: PATHS.bookings, label: 'Bookings' },
  { value: PATHS.maintenance, label: 'Maintenance' },
  { value: PATHS.notifications, label: 'Notifications' },
];

// Two-column settings row: description on the left, controls on the right.
function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Row gutter={[40, 24]} style={{ maxWidth: 980, marginTop: 4 }}>
      <Col xs={24} md={9}>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
          {description}
        </Typography.Paragraph>
      </Col>
      <Col xs={24} md={15}>
        <Card>{children}</Card>
      </Col>
    </Row>
  );
}

function ProfileTab() {
  const { user, updateUser } = useAuth();
  const { message } = App.useApp();
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null);

  const save = useMutation({
    mutationFn: (values: { name: string }) => authService.updateProfile({ name: values.name, avatarUrl: avatar }),
    onSuccess: (u) => { updateUser(u); message.success('Profile updated'); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const beforeUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { message.error('Please choose an image'); return Upload.LIST_IGNORE; }
    if (file.size > MAX_AVATAR_BYTES) { message.error('Image must be under 512 KB'); return Upload.LIST_IGNORE; }
    setAvatar(await fileToDataUrl(file));
    return Upload.LIST_IGNORE;
  };

  return (
    <Section title="Profile" description="Your name and avatar — shown across the app in the header and activity.">
      <Space align="center" size="large" style={{ marginBottom: 24 }}>
        <Avatar size={72} src={avatar ?? undefined} icon={<UserOutlined />} />
        <Space direction="vertical" size={4}>
          <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
            <Button icon={<UploadOutlined />}>Change avatar</Button>
          </Upload>
          {avatar && (
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => setAvatar(null)}>
              Remove
            </Button>
          )}
        </Space>
      </Space>
      <Form layout="vertical" initialValues={{ name: user?.name }} onFinish={(v) => save.mutate(v)}>
        <Form.Item name="name" label="Full name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="Your name" />
        </Form.Item>
        <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
          <Descriptions.Item label="Role">{user?.role.replace(/_/g, ' ')}</Descriptions.Item>
        </Descriptions>
        <Button type="primary" htmlType="submit" loading={save.isPending}>Save profile</Button>
      </Form>
    </Section>
  );
}

function SecurityTab() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const save = useMutation({
    mutationFn: (v: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(v.currentPassword, v.newPassword),
    onSuccess: () => { message.success('Password changed'); form.resetFields(); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <Section title="Password" description="Change your password. You'll need your current one to confirm it's you.">
      <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
        <Form.Item name="currentPassword" label="Current password" rules={[{ required: true, message: 'Required' }]}>
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Form.Item name="newPassword" label="New password" rules={[{ required: true, min: 8, message: 'At least 8 characters' }]} hasFeedback>
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm new password"
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm' },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue('newPassword') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Passwords do not match')),
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={save.isPending}>Change password</Button>
      </Form>
    </Section>
  );
}

function PreferencesTab() {
  const { user, updateUser } = useAuth();
  const { mode, setMode } = useThemeMode();
  const { message } = App.useApp();
  const [theme, setTheme] = useState<ThemeMode>(user?.preferences?.theme ?? mode);
  const [landingPath, setLandingPath] = useState<string>(user?.preferences?.landingPath ?? PATHS.dashboard);

  const save = useMutation({
    mutationFn: () => authService.updatePreferences({ theme, landingPath }),
    onSuccess: (u) => { updateUser(u); setMode(theme); message.success('Preferences saved'); },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <Section title="Preferences" description="Personalize your workspace. Theme applies instantly; saving stores it to your account.">
      <Form layout="vertical">
        <Form.Item label="Theme">
          <Select
            value={theme}
            onChange={(v: ThemeMode) => { setTheme(v); setMode(v); }}
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
          />
        </Form.Item>
        <Form.Item label="Default landing page" tooltip="Where you land after signing in">
          <Select value={landingPath} onChange={setLandingPath} options={LANDING_OPTIONS} />
        </Form.Item>
        <Button type="primary" loading={save.isPending} onClick={() => save.mutate()}>Save preferences</Button>
      </Form>
    </Section>
  );
}

export default function SettingsPage() {
  const { can } = useAuth();
  const items = [
    { key: 'profile', label: 'Profile', children: <ProfileTab /> },
    { key: 'security', label: 'Security', children: <SecurityTab /> },
    { key: 'preferences', label: 'Preferences', children: <PreferencesTab /> },
  ];
  if (can(PERMISSION.RBAC_MANAGE)) {
    items.push({ key: 'access', label: 'Access Control', children: <AccessControlPanel /> });
  }
  return <Tabs defaultActiveKey="profile" items={items} />;
}
