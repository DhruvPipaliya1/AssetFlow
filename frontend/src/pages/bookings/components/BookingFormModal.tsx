import { useEffect } from 'react';
import { App, Modal, Form, Select, DatePicker } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { assetsService } from '../../../services/assets.service';
import { bookingsService } from '../../../services/bookings.service';
import { apiErrorMessage } from '../../../services/apiClient';

interface Props {
  open: boolean;
  defaultAssetId?: string;
  onClose: () => void;
}

// Book a bookable resource. The server enforces no-overlap (half-open) and
// returns a friendly 409 we surface directly.
export function BookingFormModal({ open, defaultAssetId, onClose }: Props) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const { data: assets } = useQuery({
    queryKey: ['assets', { isBookable: 'true', take: 100 }],
    queryFn: () => assetsService.list({ isBookable: 'true', take: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (defaultAssetId) form.setFieldValue('assetId', defaultAssetId);
    }
  }, [open, defaultAssetId, form]);

  const create = useMutation({
    mutationFn: (v: { assetId: string; range: [Dayjs, Dayjs] }) =>
      bookingsService.create({
        assetId: v.assetId,
        startTime: v.range[0].toISOString(),
        endTime: v.range[1].toISOString(),
      }),
    onSuccess: () => {
      message.success('Booking created');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <Modal
      open={open}
      title="New booking"
      onCancel={onClose}
      onOk={() => form.validateFields().then((v) => create.mutate(v))}
      okText="Book"
      confirmLoading={create.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item name="assetId" label="Resource" rules={[{ required: true, message: 'Pick a resource' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Bookable resources"
            options={(assets?.items ?? []).map((a) => ({ value: a.id, label: `${a.assetTag} — ${a.name}` }))}
          />
        </Form.Item>
        <Form.Item name="range" label="Time slot" rules={[{ required: true, message: 'Pick a time range' }]}>
          <DatePicker.RangePicker
            showTime={{ format: 'HH:mm', minuteStep: 15 }}
            format="MMM D, YYYY HH:mm"
            style={{ width: '100%' }}
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
