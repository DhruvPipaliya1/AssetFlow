import { useEffect } from 'react';
import { App, Modal, Form, Select, Input } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../../../services/assets.service';
import { maintenanceService } from '../../../services/maintenance.service';
import { apiErrorMessage } from '../../../services/apiClient';
import { Priority } from '../../../types/enums';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RaiseMaintenanceModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const { data: assets } = useQuery({
    queryKey: ['assets', { take: 100 }],
    queryFn: () => assetsService.list({ take: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const raise = useMutation({
    mutationFn: (v: { assetId: string; description: string; priority?: Priority }) =>
      maintenanceService.raise(v),
    onSuccess: () => {
      message.success('Maintenance request raised');
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <Modal
      open={open}
      title="Raise maintenance request"
      onCancel={onClose}
      onOk={() => form.validateFields().then((v) => raise.mutate(v))}
      okText="Raise"
      confirmLoading={raise.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark="optional" initialValues={{ priority: 'MEDIUM' }}>
        <Form.Item name="assetId" label="Asset" rules={[{ required: true, message: 'Pick an asset' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Asset"
            options={(assets?.items ?? []).map((a) => ({ value: a.id, label: `${a.assetTag} — ${a.name}` }))}
          />
        </Form.Item>
        <Form.Item name="priority" label="Priority">
          <Select options={Object.values(Priority).map((p) => ({ value: p, label: p }))} />
        </Form.Item>
        <Form.Item name="description" label="Describe the issue" rules={[{ required: true, message: 'Description is required' }]}>
          <Input.TextArea rows={3} placeholder="What's wrong?" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
