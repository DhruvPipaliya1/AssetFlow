import { useEffect } from 'react';
import { App, Form, Input, Modal, Select } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { departmentsService, type DepartmentPayload } from '../../../services/departments.service';
import { employeesService } from '../../../services/employees.service';
import { apiErrorMessage } from '../../../services/apiClient';
import type { Department } from '../../../types/models';

interface Props {
  open: boolean;
  editing: Department | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  name: string;
  headUserId?: string | null;
  parentDepartmentId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export function DepartmentFormModal({ open, editing, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const isEdit = !!editing;

  // Options for the head + parent selects (cached).
  const { data: employees } = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: () => employeesService.list({ take: '100', status: 'ACTIVE' }),
    enabled: open,
  });
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsService.list,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        headUserId: editing.headUserId,
        parentDepartmentId: editing.parentDepartmentId,
        status: editing.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'ACTIVE' });
    }
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: DepartmentPayload = {
        name: values.name,
        headUserId: values.headUserId ?? null,
        parentDepartmentId: values.parentDepartmentId ?? null,
        status: values.status,
      };
      return isEdit
        ? departmentsService.update(editing!.id, payload)
        : departmentsService.create(payload);
    },
    onSuccess: () => {
      message.success(isEdit ? 'Department updated' : 'Department created');
      onSaved();
      onClose();
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  const employeeOptions = (employees?.items ?? []).map((e) => ({ value: e.id, label: `${e.name} (${e.role})` }));
  const parentOptions = (departments ?? [])
    .filter((d) => d.id !== editing?.id) // can't be its own parent
    .map((d) => ({ value: d.id, label: d.name }));

  return (
    <Modal
      title={isEdit ? 'Edit Department' : 'New Department'}
      open={open}
      onCancel={onClose}
      onOk={() => form.validateFields().then((v) => save.mutate(v))}
      confirmLoading={save.isPending}
      okText={isEdit ? 'Save' : 'Create'}
      destroyOnClose
    >
      <Form<FormValues> form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="e.g. Engineering" />
        </Form.Item>
        <Form.Item name="headUserId" label="Department Head">
          <Select allowClear showSearch optionFilterProp="label" placeholder="Assign a head" options={employeeOptions} />
        </Form.Item>
        <Form.Item name="parentDepartmentId" label="Parent Department">
          <Select allowClear showSearch optionFilterProp="label" placeholder="For hierarchy (optional)" options={parentOptions} />
        </Form.Item>
        <Form.Item name="status" label="Status">
          <Select
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
