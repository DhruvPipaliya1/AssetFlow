import { App, Modal, Form, Input, Select } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { allocationsService } from '../../../services/allocations.service';
import { apiErrorMessage } from '../../../services/apiClient';
import type { Allocation } from '../../../types/models';

interface Props {
  allocation: Allocation | null;
  onClose: () => void;
}

export function ReturnModal({ allocation, onClose }: Props) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const ret = useMutation({
    mutationFn: (v: { returnCondition?: string; checkInNotes?: string }) =>
      allocationsService.return(allocation!.id, v),
    onSuccess: () => {
      message.success('Asset returned');
      qc.invalidateQueries({ queryKey: ['allocations'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <Modal
      open={!!allocation}
      title={`Return ${allocation?.asset?.assetTag ?? 'asset'}`}
      onCancel={onClose}
      onOk={() => form.validateFields().then((v) => ret.mutate(v))}
      okText="Confirm return"
      confirmLoading={ret.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="returnCondition" label="Condition on return">
          <Select
            allowClear
            placeholder="Select condition"
            options={['Good', 'Fair', 'Damaged', 'Needs repair'].map((c) => ({ value: c, label: c }))}
          />
        </Form.Item>
        <Form.Item name="checkInNotes" label="Check-in notes">
          <Input.TextArea rows={3} placeholder="Optional notes" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
