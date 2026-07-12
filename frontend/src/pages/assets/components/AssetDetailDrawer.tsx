import { useEffect, useState } from 'react';
import { Drawer, Descriptions, Timeline, Typography, Spin, Empty, Image, Divider, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { assetsService } from '../../../services/assets.service';
import { StatusTag } from '../../../components/common';

interface Props {
  assetId: string | null;
  onClose: () => void;
}

const KIND_COLOR: Record<string, string> = {
  ALLOCATION: 'blue',
  TRANSFER: 'purple',
  MAINTENANCE: 'orange',
};

export function AssetDetailDrawer({ assetId, onClose }: Props) {
  const [qr, setQr] = useState<string | null>(null);

  const { data: asset, isLoading } = useQuery({
    queryKey: ['assets', assetId],
    queryFn: () => assetsService.get(assetId!),
    enabled: !!assetId,
  });

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

  return (
    <Drawer
      open={!!assetId}
      onClose={onClose}
      size={560}
      title={asset ? `${asset.assetTag} — ${asset.name}` : 'Asset'}
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
          </Descriptions>

          {qr && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Image src={qr} alt="QR" width={140} preview={false} />
            </div>
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
  );
}
