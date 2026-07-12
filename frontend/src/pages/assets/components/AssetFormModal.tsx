import { useEffect, useState } from 'react';
import { App, Modal, Form, Input, InputNumber, Select, Switch, DatePicker, Result, Image, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { assetsService, type AssetPayload } from '../../../services/assets.service';
import { categoriesService } from '../../../services/categories.service';
import { departmentsService } from '../../../services/departments.service';
import { apiErrorMessage } from '../../../services/apiClient';
import type { Asset } from '../../../types/models';

interface Props {
  open: boolean;
  editing: Asset | null;
  onClose: () => void;
  onSaved: () => void;
}

// Register (or edit metadata for) an asset. On successful registration it flips
// to a success view showing the auto-generated AF-#### tag + QR code.
export function AssetFormModal({ open, editing, onClose, onSaved }: Props) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [registered, setRegistered] = useState<{ assetTag: string; qrDataUrl?: string } | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesService.list });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: departmentsService.list });

  useEffect(() => {
    if (open) {
      setRegistered(null);
      if (editing) {
        form.setFieldsValue({
          ...editing,
          acquisitionCost: editing.acquisitionCost ? Number(editing.acquisitionCost) : undefined,
          acquisitionDate: editing.acquisitionDate ? dayjs(editing.acquisitionDate) : undefined,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const payload: AssetPayload = {
        name: values.name as string,
        categoryId: values.categoryId as string,
        serialNumber: (values.serialNumber as string) || undefined,
        location: (values.location as string) || undefined,
        condition: (values.condition as string) || undefined,
        acquisitionCost: values.acquisitionCost as number | undefined,
        acquisitionDate: values.acquisitionDate ? (values.acquisitionDate as dayjs.Dayjs).toISOString() : undefined,
        isBookable: !!values.isBookable,
        ownerDepartmentId: (values.ownerDepartmentId as string) || undefined,
      };
      return editing ? assetsService.update(editing.id, payload) : assetsService.create(payload);
    },
    onSuccess: (asset) => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      onSaved();
      if (editing) {
        message.success('Asset updated');
        onClose();
      } else {
        // Show the generated tag + QR.
        setRegistered({ assetTag: asset.assetTag, qrDataUrl: (asset as { qrDataUrl?: string }).qrDataUrl });
      }
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const submit = () => form.validateFields().then((v) => save.mutate(v));

  return (
    <Modal
      open={open}
      title={editing ? 'Edit asset' : 'Register asset'}
      onCancel={onClose}
      onOk={registered ? onClose : submit}
      okText={registered ? 'Done' : editing ? 'Save' : 'Register'}
      confirmLoading={save.isPending}
      cancelButtonProps={registered ? { style: { display: 'none' } } : undefined}
      destroyOnHidden
    >
      {registered ? (
        <Result
          status="success"
          title={<Typography.Text>Registered <Typography.Text strong>{registered.assetTag}</Typography.Text></Typography.Text>}
          subTitle="Scan or print this QR to tag the physical asset."
          extra={registered.qrDataUrl ? <Image src={registered.qrDataUrl} alt="QR" width={180} preview={false} /> : null}
        />
      ) : (
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. MacBook Pro 16&quot;" />
          </Form.Item>
          <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Category is required' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select a category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="serialNumber" label="Serial number">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item name="ownerDepartmentId" label="Owner department">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Optional"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="e.g. HQ / Floor 3" />
          </Form.Item>
          <Form.Item name="acquisitionCost" label="Acquisition cost">
            <InputNumber style={{ width: '100%' }} min={0} prefix="$" placeholder="Optional" />
          </Form.Item>
          <Form.Item name="acquisitionDate" label="Acquisition date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isBookable" label="Bookable resource" valuePropName="checked" tooltip="Can be reserved on the bookings calendar">
            <Switch />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
