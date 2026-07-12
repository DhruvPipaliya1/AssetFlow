import { useEffect, useState } from 'react';
import {
  App,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  DatePicker,
  Result,
  Image,
  Typography,
  Upload,
  Button,
  Space,
  Divider,
} from 'antd';
import { UploadOutlined, DeleteOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { assetsService, type AssetPayload } from '../../../services/assets.service';
import { categoriesService } from '../../../services/categories.service';
import { departmentsService } from '../../../services/departments.service';
import { apiErrorMessage } from '../../../services/apiClient';
import type { Asset, AssetCategory, CategoryCustomField, CustomFieldValue } from '../../../types/models';

interface Props {
  open: boolean;
  editing: Asset | null;
  onClose: () => void;
  onSaved: () => void;
}

const MAX_PHOTO_BYTES = 512 * 1024; // keep the inlined data URL small

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fieldInput(type: CategoryCustomField['type']) {
  switch (type) {
    case 'number':
      return <InputNumber style={{ width: '100%' }} />;
    case 'date':
      return <DatePicker style={{ width: '100%' }} />;
    case 'boolean':
      return <Switch />;
    default:
      return <Input />;
  }
}

// Register (or edit metadata for) an asset. On successful registration it flips
// to a success view showing the auto-generated AF-#### tag + QR code. Renders the
// selected category's custom fields dynamically, plus a photo upload + documents.
export function AssetFormModal({ open, editing, onClose, onSaved }: Props) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [registered, setRegistered] = useState<{ assetTag: string; qrDataUrl?: string } | null>(null);
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesService.list });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: departmentsService.list });

  const categoryId = Form.useWatch('categoryId', form) as string | undefined;
  const selectedCategory: AssetCategory | undefined = categories.find((c) => c.id === categoryId);
  const customFields = selectedCategory?.customFields ?? [];

  useEffect(() => {
    if (!open) return;
    setRegistered(null);
    if (editing) {
      const cat = categories.find((c) => c.id === editing.categoryId);
      const cfv: Record<string, unknown> = {};
      (cat?.customFields ?? []).forEach((f) => {
        const raw = editing.customFieldValues?.[f.key];
        cfv[f.key] = f.type === 'date' && raw ? dayjs(raw as string) : raw ?? undefined;
      });
      form.setFieldsValue({
        ...editing,
        acquisitionCost: editing.acquisitionCost ? Number(editing.acquisitionCost) : undefined,
        acquisitionDate: editing.acquisitionDate ? dayjs(editing.acquisitionDate) : undefined,
        documents: editing.documents ?? [],
        customFieldValues: cfv,
        photoUrl: editing.photoUrl ?? undefined,
      });
      setPhoto(editing.photoUrl ?? undefined);
    } else {
      form.resetFields();
      setPhoto(undefined);
    }
    // Intentionally keyed on open/editing only — re-running when the categories
    // query refetches would clobber in-progress input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const save = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const cat = categories.find((c) => c.id === values.categoryId);
      // Collect this category's custom-field values, coercing per declared type.
      const cfvRaw = (values.customFieldValues ?? {}) as Record<string, unknown>;
      const customFieldValues: Record<string, CustomFieldValue> = {};
      (cat?.customFields ?? []).forEach((f) => {
        let v = cfvRaw[f.key];
        if (v === undefined || v === null || v === '') return;
        if (f.type === 'date') v = (v as Dayjs).toISOString();
        else if (f.type === 'number') v = Number(v);
        else if (f.type === 'boolean') v = !!v;
        customFieldValues[f.key] = v as CustomFieldValue;
      });

      const documents = ((values.documents ?? []) as { name?: string; url?: string }[])
        .filter((d) => d?.name && d?.url)
        .map((d) => ({ name: d.name!, url: d.url! }));

      const payload: AssetPayload = {
        name: values.name as string,
        categoryId: values.categoryId as string,
        serialNumber: (values.serialNumber as string) || undefined,
        location: (values.location as string) || undefined,
        condition: (values.condition as string) || undefined,
        acquisitionCost: values.acquisitionCost as number | undefined,
        acquisitionDate: values.acquisitionDate ? (values.acquisitionDate as Dayjs).toISOString() : undefined,
        isBookable: !!values.isBookable,
        ownerDepartmentId: (values.ownerDepartmentId as string) || undefined,
        photoUrl: (values.photoUrl as string) || undefined,
        documents: editing || documents.length ? documents : undefined,
        customFieldValues: cat?.customFields?.length ? customFieldValues : undefined,
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
        setRegistered({ assetTag: asset.assetTag, qrDataUrl: (asset as { qrDataUrl?: string }).qrDataUrl });
      }
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const submit = () => form.validateFields().then((v) => save.mutate(v));

  const beforeUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Please choose an image file');
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      message.error('Image must be under 512 KB');
      return Upload.LIST_IGNORE;
    }
    const dataUrl = await fileToDataUrl(file);
    form.setFieldValue('photoUrl', dataUrl);
    setPhoto(dataUrl);
    return Upload.LIST_IGNORE; // we handle it ourselves, no antd upload list
  };

  const clearPhoto = () => {
    form.setFieldValue('photoUrl', undefined);
    setPhoto(undefined);
  };

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
      width={560}
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
          <Form.Item name="condition" label="Condition">
            <Select
              allowClear
              placeholder="Optional"
              options={['Excellent', 'Good', 'Fair', 'Poor', 'Needs repair'].map((c) => ({ value: c, label: c }))}
            />
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

          {/* Photo (stored inline as a data URL) */}
          <Form.Item name="photoUrl" hidden><Input /></Form.Item>
          <Form.Item label="Photo">
            <Space align="start">
              <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*" maxCount={1}>
                <Button icon={<UploadOutlined />}>{photo ? 'Replace' : 'Upload'}</Button>
              </Upload>
              {photo && (
                <Space direction="vertical" align="center" size={4}>
                  <Image src={photo} alt="Asset" width={96} height={96} style={{ objectFit: 'cover', borderRadius: 6 }} />
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={clearPhoto}>Remove</Button>
                </Space>
              )}
            </Space>
          </Form.Item>

          {/* Documents (manuals, invoices, warranty PDFs) */}
          <Divider titlePlacement="start">Documents</Divider>
          <Form.List name="documents">
            {(fields, { add, remove }) => (
              <div>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item {...rest} name={[name, 'name']} rules={[{ required: true, message: 'Name' }]} noStyle>
                      <Input placeholder="Label (e.g. Invoice)" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'url']} rules={[{ required: true, type: 'url', message: 'Valid URL' }]} noStyle>
                      <Input placeholder="https://…" style={{ width: 240 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  Add document link
                </Button>
              </div>
            )}
          </Form.List>

          {/* Category-specific fields */}
          {customFields.length > 0 && (
            <>
              <Divider titlePlacement="start">{selectedCategory?.name} details</Divider>
              {customFields.map((f) => (
                <Form.Item
                  key={f.key}
                  name={['customFieldValues', f.key]}
                  label={f.label}
                  valuePropName={f.type === 'boolean' ? 'checked' : 'value'}
                >
                  {fieldInput(f.type)}
                </Form.Item>
              ))}
            </>
          )}
        </Form>
      )}
    </Modal>
  );
}
