import type { ReactNode } from 'react';
import { Modal, Descriptions } from 'antd';

export interface DetailItem {
  label: string;
  value: ReactNode;
}

export interface DetailModalProps {
  open: boolean;
  title: ReactNode;
  items: DetailItem[];
  header?: ReactNode; // e.g. WorkflowSteps rendered above the field list
  footer?: ReactNode; // action buttons; defaults to none
  onClose: () => void;
  width?: number;
}

// Generic read-only detail popup — renders a record's fields as a bordered
// Descriptions list. Used for row-click details across the list pages.
export function DetailModal({ open, title, items, header, footer, onClose, width = 540 }: DetailModalProps) {
  return (
    <Modal open={open} title={title} onCancel={onClose} footer={footer ?? null} width={width} destroyOnHidden>
      {header && <div style={{ marginBottom: 16 }}>{header}</div>}
      <Descriptions column={1} size="small" bordered>
        {items.map((it, i) => (
          <Descriptions.Item key={i} label={it.label}>
            {it.value === null || it.value === undefined || it.value === '' ? '—' : it.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Modal>
  );
}
