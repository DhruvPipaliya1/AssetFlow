import { useEffect } from 'react';
import { App, Button, Form, Input, Modal, Select, Space, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { categoriesService, type CategoryPayload } from '../../../services/categories.service';
import { apiErrorMessage } from '../../../services/apiClient';
import type { AssetCategory, CategoryCustomField } from '../../../types/models';

interface Props {
  open: boolean;
  editing: AssetCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  customFields?: CategoryCustomField[];
}

const TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes/No' },
];

export function CategoryFormModal({ open, editing, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const isEdit = !!editing;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        status: editing.status,
        customFields: editing.customFields ?? [],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'ACTIVE', customFields: [] });
    }
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CategoryPayload = {
        name: values.name,
        status: values.status,
        customFields: values.customFields ?? [],
      };
      return isEdit
        ? categoriesService.update(editing!.id, payload)
        : categoriesService.create(payload);
    },
    onSuccess: () => {
      message.success(isEdit ? 'Category updated' : 'Category created');
      onSaved();
      onClose();
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <Modal
      title={isEdit ? 'Edit Category' : 'New Category'}
      open={open}
      onCancel={onClose}
      onOk={() => form.validateFields().then((v) => save.mutate(v))}
      confirmLoading={save.isPending}
      okText={isEdit ? 'Save' : 'Create'}
      destroyOnClose
    >
      <Form<FormValues> form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="e.g. Electronics" />
        </Form.Item>
        <Form.Item name="status" label="Status">
          <Select
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        </Form.Item>

        <Typography.Text type="secondary">Custom fields (optional)</Typography.Text>
        <Form.List name="customFields">
          {(fields, { add, remove }) => (
            <div style={{ marginTop: 8 }}>
              {fields.map(({ key, name, ...rest }) => (
                <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item {...rest} name={[name, 'key']} rules={[{ required: true, message: 'key' }]} noStyle>
                    <Input placeholder="key" style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'label']} rules={[{ required: true, message: 'label' }]} noStyle>
                    <Input placeholder="Label" style={{ width: 150 }} />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, 'type']} rules={[{ required: true, message: 'type' }]} noStyle>
                    <Select placeholder="Type" options={TYPE_OPTIONS} style={{ width: 110 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add({ type: 'text' })} icon={<PlusOutlined />} block>
                Add field
              </Button>
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
