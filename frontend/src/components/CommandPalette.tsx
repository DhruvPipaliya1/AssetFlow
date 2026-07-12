import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Input, Tag, Empty, Spin, Typography } from 'antd';
import { SearchOutlined, LaptopOutlined, UserOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../services/search.service';
import { useAuth } from '../hooks/useAuth';
import { PERMISSION } from '../types/permissions';
import { PATHS } from '../routes/paths';
import { StatusTag } from './common';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <Typography.Text
        type="secondary"
        style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, padding: '4px 12px', display: 'block' }}
      >
        {title}
      </Typography.Text>
      {children}
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  extra,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        background: hover ? 'var(--af-fill, rgba(0,0,0,0.05))' : 'transparent',
      }}
    >
      <span style={{ fontSize: 16, color: 'var(--af-text-secondary, #888)' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {subtitle && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Typography.Text>}
      </div>
      {extra}
    </div>
  );
}

// ⌘/Ctrl+K command palette: quick-jump across assets, people & departments.
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ('');
      setDebounced('');
    }
  }, [open]);

  const canViewOrg = can(PERMISSION.ORG_MANAGE);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchService.query(debounced),
    enabled: debounced.length >= 1,
  });

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const hasResults =
    !!data && (data.assets.length > 0 || (canViewOrg && (data.employees.length > 0 || data.departments.length > 0)));

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} destroyOnHidden width={560} styles={{ body: { padding: 0 } }}>
      <Input
        size="large"
        autoFocus
        variant="borderless"
        prefix={<SearchOutlined />}
        placeholder="Search assets, people, departments…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ padding: '14px 16px', borderBottom: '1px solid var(--af-border)' }}
      />
      <div style={{ maxHeight: 420, overflowY: 'auto', padding: 8 }}>
        {debounced.length < 1 ? (
          <Typography.Text type="secondary" style={{ display: 'block', padding: 16, textAlign: 'center' }}>
            Type to search. Press Esc to close.
          </Typography.Text>
        ) : isFetching ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : !hasResults ? (
          <Empty description="No matches" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 16 }} />
        ) : (
          <>
            {data.assets.length > 0 && (
              <Group title="Assets">
                {data.assets.map((a) => (
                  <Row
                    key={a.id}
                    icon={<LaptopOutlined />}
                    title={`${a.assetTag} — ${a.name}`}
                    extra={<StatusTag status={a.status} />}
                    onClick={() => go(`${PATHS.assets}?asset=${a.id}`)}
                  />
                ))}
              </Group>
            )}
            {canViewOrg && data.employees.length > 0 && (
              <Group title="People">
                {data.employees.map((e) => (
                  <Row
                    key={e.id}
                    icon={<UserOutlined />}
                    title={e.name}
                    subtitle={e.email}
                    extra={<Tag>{e.role.replace(/_/g, ' ')}</Tag>}
                    onClick={() => go(PATHS.organization)}
                  />
                ))}
              </Group>
            )}
            {canViewOrg && data.departments.length > 0 && (
              <Group title="Departments">
                {data.departments.map((d) => (
                  <Row key={d.id} icon={<ApartmentOutlined />} title={d.name} onClick={() => go(PATHS.organization)} />
                ))}
              </Group>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
