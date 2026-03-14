import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Typography,
  Space,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getCounterparties, createCounterparty } from '../../api/tradingApi';
import { Counterparty } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const COUNTERPARTY_TYPES = ['BANK', 'BROKER', 'REFINER', 'MINER', 'FUND', 'OTHER'];
const CREDIT_RATINGS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'B', 'NR'];

export default function Counterparties() {
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchCounterparties = async () => {
    setLoading(true);
    try {
      const res = await getCounterparties();
      setCounterparties(res.data);
    } catch {
      message.error('Failed to load counterparties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounterparties();
  }, []);

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await createCounterparty({
        name: values.name as string,
        code: values.code as string,
        type: values.type as string,
        credit_rating: values.credit_rating as string | undefined,
        credit_limit: values.credit_limit as number | undefined,
      });
      message.success('Counterparty created');
      setModalOpen(false);
      form.resetFields();
      fetchCounterparties();
    } catch {
      message.error('Failed to create counterparty');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Counterparty> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Credit Rating',
      dataIndex: 'credit_rating',
      key: 'credit_rating',
      render: (val: string | null) => val ?? '—',
    },
    {
      title: 'Credit Limit',
      dataIndex: 'credit_limit',
      key: 'credit_limit',
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Counterparties</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add Counterparty
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={counterparties}
        loading={loading}
        pagination={{ pageSize: 15, showSizeChanger: true }}
        size="middle"
      />

      <Modal
        title="Add Counterparty"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Enter code' }]}>
            <Input placeholder="e.g. HSBC" />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter name' }]}>
            <Input placeholder="Full legal name" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Select type' }]}>
            <Select
              placeholder="Select type"
              options={COUNTERPARTY_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          <Form.Item name="credit_rating" label="Credit Rating">
            <Select
              allowClear
              placeholder="Select rating"
              options={CREDIT_RATINGS.map((r) => ({ label: r, value: r }))}
            />
          </Form.Item>
          <Form.Item name="credit_limit" label="Credit Limit (USD)">
            <InputNumber min={0} step={100000} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Create
              </Button>
              <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
