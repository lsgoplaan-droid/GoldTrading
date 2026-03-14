import { useEffect, useState } from 'react';
import { Card, Table, Typography, Spin, Alert, Button, Modal, Form, Input, Select, InputNumber, Progress, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getRiskLimits, createRiskLimit } from '../../api/riskApi';
import { RiskLimit } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const { Title } = Typography;

export default function Limits() {
  const [limits, setLimits] = useState<RiskLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const res = await getRiskLimits();
      setLimits(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load risk limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      await createRiskLimit({
        limit_type: values.limit_type,
        limit_name: values.limit_name,
        max_value: values.max_value,
        currency: values.currency,
      });
      setModalOpen(false);
      form.resetFields();
      await fetchLimits();
    } catch (err: any) {
      setError(err.message || 'Failed to create limit');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<RiskLimit> = [
    {
      title: 'Limit Name',
      dataIndex: 'limit_name',
      key: 'limit_name',
    },
    {
      title: 'Type',
      dataIndex: 'limit_type',
      key: 'limit_type',
      render: (val: string) => <Tag>{val}</Tag>,
    },
    {
      title: 'Max Value',
      dataIndex: 'max_value',
      key: 'max_value',
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Current Value',
      dataIndex: 'current_value',
      key: 'current_value',
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization_pct',
      key: 'utilization_pct',
      width: 200,
      render: (pct: number, record: RiskLimit) => {
        const status = record.breached ? 'exception' : pct >= 80 ? 'active' : 'normal';
        return (
          <Progress
            percent={Math.min(pct, 100)}
            status={status}
            size="small"
            format={() => `${formatNumber(pct, 1)}%`}
          />
        );
      },
    },
    {
      title: 'Breached',
      dataIndex: 'breached',
      key: 'breached',
      width: 100,
      align: 'center',
      render: (breached: boolean) => (
        <Tag color={breached ? 'red' : 'green'}>{breached ? 'YES' : 'NO'}</Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error && limits.length === 0) {
    return <Alert type="error" message="Error" description={error} showIcon />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Risk Limits</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add Limit
        </Button>
      </div>

      {error && <Alert type="error" message={error} showIcon closable style={{ marginBottom: 16 }} />}

      <Card>
        <Table
          columns={columns}
          dataSource={limits}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      <Modal
        title="Add Risk Limit"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="limit_name"
            label="Limit Name"
            rules={[{ required: true, message: 'Please enter a limit name' }]}
          >
            <Input placeholder="e.g. Max Position Size" />
          </Form.Item>
          <Form.Item
            name="limit_type"
            label="Limit Type"
            rules={[{ required: true, message: 'Please select a limit type' }]}
          >
            <Select placeholder="Select type">
              <Select.Option value="POSITION">Position</Select.Option>
              <Select.Option value="VAR">VaR</Select.Option>
              <Select.Option value="EXPOSURE">Exposure</Select.Option>
              <Select.Option value="CREDIT">Credit</Select.Option>
              <Select.Option value="CONCENTRATION">Concentration</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="max_value"
            label="Max Value"
            rules={[{ required: true, message: 'Please enter max value' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="currency" label="Currency" initialValue="USD">
            <Select>
              <Select.Option value="USD">USD</Select.Option>
              <Select.Option value="EUR">EUR</Select.Option>
              <Select.Option value="GBP">GBP</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Create Limit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
