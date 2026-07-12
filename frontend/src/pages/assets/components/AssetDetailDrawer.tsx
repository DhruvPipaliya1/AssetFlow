import { useEffect, useState } from 'react';
import { Drawer, Descriptions, Timeline, Typography, Spin, Empty, Image, Divider, Tag, Space, Button } from 'antd';
import { FileTextOutlined, SwapOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { assetsService } from '../../../services/assets.service';
import { categoriesService } from '../../../services/categories.service';
import { StatusTag } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { PERMISSION } from '../../../types/permissions';
import { AllocateModal } from '../../allocations/components/AllocateModal';
import type { CategoryCustomField, CustomFieldValue } from '../../../types/models';

interface Props {
  assetId: string | null;
  onClose: () => void;
}

const KIND_COLOR: Record<string, string> = {
  ALLOCATION: 'blue',
  TRANSFER: 'purple',
  MAINTENANCE: 'orange',
};

function formatCustomValue(type: CategoryCustomField['type'], value: CustomFieldValue): string {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (type === 'date') return dayjs(value as string).isValid() ? dayjs(value as string).format('MMM D, YYYY') : String(value);
  return String(value);
}

export function AssetDetailDrawer({ assetId, onClose }: Props) {
  const { can } = useAuth();
  const [qr, setQr] = useState<string | null>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: ['assets', assetId],
    queryFn: () => assetsService.get(assetId!),
    enabled: !!assetId,
  });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesService.list });
  const customFields = categories.find((c) => c.id === asset?.categoryId)?.customFields ?? [];

  // Fetch the QR (auth-guarded) as an object URL; revoke on change/unmount.
  useEffect(() => {
    if (!assetId) return;
    let url: string | null = null;
    assetsService.qrObjectUrl(assetId).then((u) => {
      url = u;
      setQr(u);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
      setQr(null);
    };
  }, [assetId]);

  const canAllocate = !!asset && asset.status === 'AVAILABLE' && can(PERMISSION.ASSET_ALLOCATE);

  return (
    <>
      <Drawer
        open={!!assetId}
        onClose={onClose}
        size={560}
        title={asset ? `${asset.assetTag} — ${asset.name}` : 'Asset'}
        extra={
          canAllocate ? (
            <Button type="primary" icon={<SwapOutlined />} onClick={() => setAllocateOpen(true)}>
              Allocate
            </Button>
          ) : undefined
        }
      >
        {isLoading || !asset ? (
          <Spin />
        ) : (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Status"><StatusTag status={asset.status} /></Descriptions.Item>
              <Descriptions.Item label="Category">{asset.category?.name ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Serial">{asset.serialNumber ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Location">{asset.location ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Owner dept">{asset.ownerDepartment?.name ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Held by">{asset.currentHolderUser?.name ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Bookable">{asset.isBookable ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>}</Descriptions.Item>
              <Descriptions.Item label="Cost">{asset.acquisitionCost ? `$${asset.acquisitionCost}` : '—'}</Descriptions.Item>
              {customFields.map((f) => (
                <Descriptions.Item key={f.key} label={f.label}>
                  {formatCustomValue(f.type, asset.customFieldValues?.[f.key] ?? null)}
                </Descriptions.Item>
              ))}
            </Descriptions>

            {canAllocate && (
              <Button
                type="primary"
                icon={<SwapOutlined />}
                block
                style={{ marginTop: 16 }}
                onClick={() => setAllocateOpen(true)}
              >
                Allocate this asset
              </Button>
            )}

            {asset.photoUrl && (
              <>
                <Divider titlePlacement="start">Asset photo</Divider>
                <div style={{ textAlign: 'center' }}>
                  <Image src={asset.photoUrl} alt={asset.name} style={{ maxHeight: 200, borderRadius: 8 }} />
                </div>
              </>
            )}

            {asset.documents && asset.documents.length > 0 && (
              <>
                <Divider titlePlacement="start">Documents</Divider>
                <Space direction="vertical" size={4}>
                  {asset.documents.map((d) => (
                    <a key={d.url} href={d.url} target="_blank" rel="noreferrer">
                      <FileTextOutlined /> {d.name}
                    </a>
                  ))}
                </Space>
              </>
            )}

            {qr && (
              <>
                <Divider titlePlacement="start">QR code</Divider>
                <div style={{ textAlign: 'center' }}>
                  <Image src={qr} alt={`QR code for ${asset.assetTag}`} width={140} preview={false} />
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Scan to identify {asset.assetTag}
                    </Typography.Text>
                  </div>
                </div>
              </>
            )}

            <Divider titlePlacement="start">History</Divider>
            {asset.history.length === 0 ? (
              <Empty description="No activity yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={asset.history.map((h) => ({
                  color: KIND_COLOR[h.kind] ?? 'gray',
                  children: (
                    <div>
                      <Typography.Text strong>{h.kind}</Typography.Text> <StatusTag status={h.status} />
                      <div>{h.summary}</div>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(h.at).format('MMM D, YYYY HH:mm')}
                      </Typography.Text>
                    </div>
                  ),
                }))}
              />
            )}
          </>
        )}
      </Drawer>

      <AllocateModal
        open={allocateOpen}
        onClose={() => setAllocateOpen(false)}
        presetAsset={asset ? { id: asset.id, label: `${asset.assetTag} — ${asset.name}` } : undefined}
      />
    </>
  );
}
