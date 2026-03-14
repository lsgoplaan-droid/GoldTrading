import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  Tag,
  Typography,
  Space,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAllocations, createAllocation, releaseAllocation, getInventory } from '../../api/logisticsApi';
import { getCounterparties } from '../../api/tradingApi';
import { Allocation, GoldItem, Counterparty } from '../../types';
import { formatDate } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Title } = Typography;

const ALLOCATION_TYPES = ['ALLOCATED', 'EARMARKED', 'PLEDGED'];

export default function Allocations() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await getAllocations();
      setAllocations(res.data);
    } catch {
      message.error('Failed to load allocations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  const handleOpenModal = async () => {
    setModalOpen(true);
    try {
      const [itemsRes, cpRes] = await Promise.all([
        getInventory(undefined, 'AVAILABLE'),
        getCounterparties(),
      ]);
      setGoldItems(itemsRes.data);
      setCounterparties(cpRes.data);
    } catch {
      message.error('Failed to load form data');
    }
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await createAllocation({
        gold_item_id: values.gold_item_id as number,
        counterparty_id: values.counterparty_id as number,
        allocation_type: values.allocation_type as string,
        allocated_date: (values.allocated_date as dayjs.Dayjs).format('YYYY-MM-DD'),
      });
      message.success('Allocation created');
      setModalOpen(false);
      form.resetFields();
      fetchAllocations();
    } catch {
      message.error('Failed to create allocation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (id: number) => {
    try {
      await releaseAllocation(id);
      message.success('Allocation released');
      fetchAllocations();
    } catch {
      message.error('Failed to release allocation');
    }
  };

  const columns: ColumnsType<Allocation> = [
    {
      title: 'Gold Item Serial',
      dataIndex: 'gold_item_serial',
      key: 'gold_item_serial',
      render: (val: string | null) => val ?? '—',
      sorter: (a, b) => (a.gold_item_serial ?? '').localeCompare(b.gold_item_serial ?? ''),
    },
    {
      title: 'Counterparty',
      dataIndex: 'counterparty_name',
      key: 'counterparty_name',
      render: (val: string | null) => val ?? '—',
      sorter: (a, b) => (a.counterparty_name ?? '').localeCompare(b.counterparty_name ?? ''),
    },
    {
      title: 'Type',
      dataIndex: 'allocation_type',
      key: 'allocation_type',
    },
    {
      title: 'Allocated Date',
      dataIndex: 'allocated_date',
      key: 'allocated_date',
      render: (val: string) => formatDate(val),
      sorter: (a, b) => a.allocated_date.localeCompare(b.allocated_date),
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Released'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Allocation) =>
        record.is_active ? (
          <Popconfirm
            title="Release this allocation?"
            onConfirm={() => handleRelease(record.id)}
          >
            <Button type="link" size="small" danger>
              Release
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Allocations</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAllocations}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Allocate
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={allocations}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        size="middle"
      />

      <Modal
        title="Create Allocation"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ allocated_date: dayjs() }}
        >
          <Form.Item name="gold_item_id" label="Gold Item" rules={[{ required: true, message: 'Select a gold item' }]}>
            <Select
              showSearch
              placeholder="Select gold item"
              optionFilterProp="label"
              options={goldItems.map((item) => ({
                label: `${item.serial_number} — ${item.item_type} — ${item.weight_oz} oz`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="counterparty_id" label="Counterparty" rules={[{ required: true, message: 'Select counterparty' }]}>
            <Select
              showSearch
              placeholder="Select counterparty"
              optionFilterProp="label"
              options={counterparties
                .filter((c) => c.is_active)
                .map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="allocation_type" label="Allocation Type" rules={[{ required: true, message: 'Select type' }]}>
            <Select
              placeholder="Select type"
              options={ALLOCATION_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
          <Form.Item name="allocated_date" label="Allocated Date" rules={[{ required: true, message: 'Select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Allocate
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
