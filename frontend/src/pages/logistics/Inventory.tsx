import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Space,
  message,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getInventory, getVaults, createGoldItem } from '../../api/logisticsApi';
import { GoldItem, Vault } from '../../types';
import { formatNumber } from '../../utils/formatters';
import StatusTag from '../../components/common/StatusTag';

const { Title } = Typography;

const ITEM_TYPES = ['BAR', 'COIN', 'GRAIN', 'OTHER'];
const ITEM_STATUSES = ['AVAILABLE', 'ALLOCATED', 'IN_TRANSIT', 'RESERVED'];

export default function Inventory() {
  const [items, setItems] = useState<GoldItem[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vaultFilter, setVaultFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, vaultRes] = await Promise.all([
        getInventory(vaultFilter, statusFilter),
        getVaults(),
      ]);
      setItems(invRes.data);
      setVaults(vaultRes.data);
    } catch {
      message.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vaultFilter, statusFilter]);

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await createGoldItem({
        serial_number: values.serial_number as string,
        item_type: values.item_type as string,
        weight_oz: values.weight_oz as number,
        gross_weight_oz: values.gross_weight_oz as number,
        purity: values.purity as number,
        refiner: values.refiner as string | undefined,
        assay_certificate: values.assay_certificate as string | undefined,
        vault_id: values.vault_id as number,
        owner: values.owner as string | undefined,
      });
      message.success('Gold item added');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      message.error('Failed to add gold item');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<GoldItem> = [
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
      sorter: (a, b) => a.serial_number.localeCompare(b.serial_number),
    },
    {
      title: 'Type',
      dataIndex: 'item_type',
      key: 'item_type',
    },
    {
      title: 'Weight (oz)',
      dataIndex: 'weight_oz',
      key: 'weight_oz',
      align: 'right',
      render: (val: number) => formatNumber(val),
      sorter: (a, b) => a.weight_oz - b.weight_oz,
    },
    {
      title: 'Purity',
      dataIndex: 'purity',
      key: 'purity',
      align: 'right',
      render: (val: number) => `${(val * 100).toFixed(2)}%`,
    },
    {
      title: 'Fine Weight',
      dataIndex: 'fine_weight_oz',
      key: 'fine_weight_oz',
      align: 'right',
      render: (val: number) => formatNumber(val),
    },
    {
      title: 'Refiner',
      dataIndex: 'refiner',
      key: 'refiner',
      render: (val: string | null) => val ?? '—',
    },
    {
      title: 'Vault',
      dataIndex: 'vault_name',
      key: 'vault_name',
      render: (val: string | null) => val ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      render: (val: string | null) => val ?? '—',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Gold Inventory</Title>
        <Space>
          <Select
            placeholder="Filter by vault"
            allowClear
            style={{ width: 180 }}
            value={vaultFilter}
            onChange={(val) => setVaultFilter(val)}
            options={vaults.map((v) => ({ label: v.name, value: v.id }))}
          />
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={ITEM_STATUSES.map((s) => ({ label: s, value: s }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Add Item
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        size="middle"
      />

      <Modal
        title="Add Gold Item"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="serial_number" label="Serial Number" rules={[{ required: true, message: 'Enter serial number' }]}>
            <Input placeholder="e.g. AU-BAR-001" />
          </Form.Item>
          <Form.Item name="item_type" label="Type" rules={[{ required: true, message: 'Select type' }]}>
            <Select options={ITEM_TYPES.map((t) => ({ label: t, value: t }))} />
          </Form.Item>
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="weight_oz" label="Weight (oz)" rules={[{ required: true, message: 'Enter weight' }]} style={{ flex: 1 }}>
              <InputNumber min={0.001} step={1} precision={3} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="gross_weight_oz" label="Gross Weight (oz)" rules={[{ required: true, message: 'Enter gross weight' }]} style={{ flex: 1 }}>
              <InputNumber min={0.001} step={1} precision={3} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="purity" label="Purity (0-1)" rules={[{ required: true, message: 'Enter purity' }]}>
            <InputNumber min={0} max={1} step={0.001} precision={4} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="refiner" label="Refiner">
            <Input placeholder="e.g. PAMP" />
          </Form.Item>
          <Form.Item name="assay_certificate" label="Assay Certificate">
            <Input placeholder="Certificate reference" />
          </Form.Item>
          <Form.Item name="vault_id" label="Vault" rules={[{ required: true, message: 'Select vault' }]}>
            <Select
              placeholder="Select vault"
              options={vaults.filter((v) => v.is_active).map((v) => ({ label: `${v.name} (${v.code})`, value: v.id }))}
            />
          </Form.Item>
          <Form.Item name="owner" label="Owner">
            <Input placeholder="Owner name" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Add Item
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
