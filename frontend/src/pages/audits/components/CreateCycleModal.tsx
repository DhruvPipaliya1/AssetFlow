import { useEffect } from 'react';
import { App, Modal, Form, Input, Select, DatePicker } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { auditsService } from '../../../services/audits.service';
import { departmentsService } from '../../../services/departments.service';
import { apiErrorMessage } from '../../../services/apiClient';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateCycleModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const scopeType = Form.useWatch('scopeType', form);

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: departmentsService.list });

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  const create = useMutation({
    mutationFn: (v: { name: string; scopeType: 'DEPARTMENT' | 'LOCATION'; scopeValue: string; range: [Dayjs, Dayjs] }) =>
      auditsService.createCycle({
        name: v.name,
        scopeType: v.scopeType,
        scopeValue: v.scopeValue,
        startDate: v.range[0].toISOString(),
        endDate: v.range[1].toISOString(),
      }),
    onSuccess: () => {
      message.success('Audit cycle created');
      qc.invalidateQueries({ queryKey: ['audit-cycles'] });
      onClose();
    },
    onError: (e) => message.error(apiErrorMessage(e)),
  });

  return (
    <Modal
      open={open}
      title="Create audit cycle"
      onCancel={onClose}
      onOk={() => form.validateFields().then((v) => create.mutate(v))}
      okText="Create"
      confirmLoading={create.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark="optional" initialValues={{ scopeType: 'DEPARTMENT' }}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="e.g. Q3 Engineering Audit" />
        </Form.Item>
        <Form.Item name="scopeType" label="Scope">
          <Select
            options={[{ value: 'DEPARTMENT', label: 'By department' }, { value: 'LOCATION', label: 'By location' }]}
            onChange={() => form.setFieldValue('scopeValue', undefined)}
          />
        </Form.Item>
        <Form.Item name="scopeValue" label={scopeType === 'LOCATION' ? 'Location' : 'Department'} rules={[{ required: true, message: 'Scope is required' }]}>
          {scopeType === 'LOCATION' ? (
            <Input placeholder="e.g. HQ / Floor 3" />
          ) : (
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select a department"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          )}
        </Form.Item>
        <Form.Item name="range" label="Window" rules={[{ required: true, message: 'Date range is required' }]}>
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
