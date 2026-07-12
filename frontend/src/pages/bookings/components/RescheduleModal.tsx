import { useEffect } from 'react';
import { App, Modal, Form, DatePicker } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { bookingsService } from '../../../services/bookings.service';
import { apiErrorMessage } from '../../../services/apiClient';
import type { Booking } from '../../../types/models';

interface Props {
  booking: Booking | null;
  onClose: () => void;
}

export function RescheduleModal({ booking, onClose }: Props) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    if (booking) form.setFieldValue('range', [dayjs(booking.startTime), dayjs(booking.endTime)]);
  }, [booking, form]);

  const reschedule = useMutation({
    mutationFn: (v: { range: [Dayjs, Dayjs] }) =>
      bookingsService.reschedule(booking!.id, {
        startTime: v.range[0].toISOString(),
        endTime: v.range[1].toISOString(),
      }),
    onSuccess: () => {
      message.success('Booking rescheduled');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      onClose();
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <Modal
      open={!!booking}
      title="Reschedule booking"
      onCancel={onClose}
      onOk={() => form.validateFields().then((v) => reschedule.mutate(v))}
      okText="Reschedule"
      confirmLoading={reschedule.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="range" label="New time slot" rules={[{ required: true, message: 'Pick a time range' }]}>
          <DatePicker.RangePicker showTime={{ format: 'HH:mm', minuteStep: 15 }} format="MMM D, YYYY HH:mm" style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
