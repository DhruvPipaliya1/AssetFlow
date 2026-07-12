import { useEffect, useState } from 'react';
import { App, Modal, Form, Select, DatePicker, Alert, Button, Space } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { assetsService } from '../../../services/assets.service';
import { employeesService } from '../../../services/employees.service';
import { allocationsService } from '../../../services/allocations.service';
import { transfersService } from '../../../services/transfers.service';
import { apiErrorMessage, apiErrorStatus, apiErrorDetails } from '../../../services/apiClient';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Conflict {
  heldBy?: { id: string; name: string } | null;
  action?: string;
}

// Allocate an available asset to a user. If the asset is already held the server
// returns 409 { heldBy, action: TRANSFER_REQUEST } — we surface that and offer a
// one-click Transfer Request to the same user (the headline conflict flow).
export function AllocateModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [conflict, setConflict] = useState<Conflict | null>(null);

  const { data: assets } = useQuery({
    queryKey: ['assets', { status: 'AVAILABLE', take: 100 }],
    queryFn: () => assetsService.list({ status: 'AVAILABLE', take: 100 }),
    enabled: open,
  });
  const { data: employees } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => employeesService.list({ take: '100' }),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      setConflict(null);
    }
  }, [open, form]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['allocations'] });
    qc.invalidateQueries({ queryKey: ['assets'] });
    qc.invalidateQueries({ queryKey: ['transfers'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const allocate = useMutation({
    mutationFn: (v: { assetId: string; allocatedToUserId: string; expectedReturnDate?: Dayjs }) =>
      allocationsService.allocate({
        assetId: v.assetId,
        allocatedToUserId: v.allocatedToUserId,
        expectedReturnDate: v.expectedReturnDate ? v.expectedReturnDate.toISOString() : undefined,
      }),
    onSuccess: () => {
      message.success('Asset allocated');
      invalidate();
      onClose();
    },
    onError: (e) => {
      if (apiErrorStatus(e) === 409) {
        setConflict(apiErrorDetails<Conflict>(e) ?? {});
      } else {
        message.error(apiErrorMessage(e));
      }
    },
  });

  const requestTransfer = useMutation({
    mutationFn: () => {
      const { assetId, allocatedToUserId } = form.getFieldsValue();
      return transfersService.create({ assetId, toUserId: allocatedToUserId });
    },
    onSuccess: () => {
      message.success('Transfer request created');
      invalidate();
      onClose();
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <Modal
      open={open}
      title="Allocate asset"
      onCancel={onClose}
      onOk={() => form.validateFields().then((v) => allocate.mutate(v))}
      okText="Allocate"
      confirmLoading={allocate.isPending}
      okButtonProps={{ disabled: !!conflict }}
      destroyOnHidden
    >
      {conflict && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Currently held by ${conflict.heldBy?.name ?? 'another user'}`}
          description={
            <Space direction="vertical">
              <span>You can't allocate a held asset. Request a transfer to move it instead.</span>
              <Button
                type="primary"
                icon={<SwapOutlined />}
                loading={requestTransfer.isPending}
                onClick={() => requestTransfer.mutate()}
              >
                Request transfer
              </Button>
            </Space>
          }
        />
      )}
      <Form form={form} layout="vertical" requiredMark="optional" onValuesChange={() => setConflict(null)}>
        <Form.Item name="assetId" label="Asset" rules={[{ required: true, message: 'Pick an asset' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Available assets"
            options={(assets?.items ?? []).map((a) => ({ value: a.id, label: `${a.assetTag} — ${a.name}` }))}
          />
        </Form.Item>
        <Form.Item name="allocatedToUserId" label="Allocate to" rules={[{ required: true, message: 'Pick a recipient' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Recipient"
            options={(employees?.items ?? []).map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
          />
        </Form.Item>
        <Form.Item name="expectedReturnDate" label="Expected return">
          <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs(), 'day')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
