import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Typography,
  Space,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getShipments, getVaults, getInventory, createShipment, updateShipmentStatus } from '../../api/logisticsApi';
import { Shipment, Vault, GoldItem } from '../../types';
import { formatDate, formatNumber } from '../../utils/formatters';
import StatusTag from '../../components/common/StatusTag';
import dayjs from 'dayjs';

const { Title } = Typography;

const SHIPMENT_STATUSES = ['PLANNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

export default function Shipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [availableItems, setAvailableItems] = useState<GoldItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const [shipRes, vaultRes] = await Promise.all([getShipments(), getVaults()]);
      setShipments(shipRes.data);
      setVaults(vaultRes.data);
    } catch {
      message.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleOpenModal = async () => {
    setModalOpen(true);
    try {
      const res = await getInventory(undefined, 'AVAILABLE');
      setAvailableItems(res.data);
    } catch {
      message.error('Failed to load available items');
    }
  };

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await createShipment({
        origin_vault_id: values.origin_vault_id as number,
        destination_vault_id: values.destination_vault_id as number,
        carrier: values.carrier as string | undefined,
        departure_date: values.departure_date
          ? (values.departure_date as dayjs.Dayjs).format('YYYY-MM-DD')
          : undefined,
        estimated_arrival: values.estimated_arrival
          ? (values.estimated_arrival as dayjs.Dayjs).format('YYYY-MM-DD')
          : undefined,
        insurance_value: values.insurance_value as number | undefined,
        gold_item_ids: values.gold_item_ids as number[],
      });
      message.success('Shipment created');
      setModalOpen(false);
      form.resetFields();
      fetchShipments();
    } catch {
      message.error('Failed to create shipment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const actual_arrival = status === 'DELIVERED' ? dayjs().format('YYYY-MM-DD') : undefined;
      await updateShipmentStatus(id, status, actual_arrival);
      message.success(`Shipment ${status.toLowerCase()}`);
      fetchShipments();
    } catch {
      message.error('Failed to update shipment status');
    }
  };

  const columns: ColumnsType<Shipment> = [
    {
      title: 'Ref',
      dataIndex: 'shipment_ref',
      key: 'shipment_ref',
      sorter: (a, b) => a.shipment_ref.localeCompare(b.shipment_ref),
    },
    {
      title: 'Origin',
      dataIndex: 'origin_vault_name',
      key: 'origin_vault_name',
      render: (val: string | null) => val ?? '—',
    },
    {
      title: 'Destination',
      dataIndex: 'destination_vault_name',
      key: 'destination_vault_name',
      render: (val: string | null) => val ?? '—',
    },
    {
      title: 'Carrier',
      dataIndex: 'carrier',
      key: 'carrier',
      render: (val: string | null) => val ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Departure',
      dataIndex: 'departure_date',
      key: 'departure_date',
      render: (val: string | null) => (val ? formatDate(val) : '—'),
    },
    {
      title: 'ETA',
      dataIndex: 'estimated_arrival',
      key: 'estimated_arrival',
      render: (val: string | null) => (val ? formatDate(val) : '—'),
    },
    {
      title: 'Actual Arrival',
      dataIndex: 'actual_arrival',
      key: 'actual_arrival',
      render: (val: string | null) => (val ? formatDate(val) : '—'),
    },
    {
      title: 'Items',
      dataIndex: 'item_count',
      key: 'item_count',
      align: 'right',
    },
    {
      title: 'Weight (oz)',
      dataIndex: 'total_weight_oz',
      key: 'total_weight_oz',
      align: 'right',
      render: (val: number) => formatNumber(val),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Shipment) => (
        <Space size="small">
          {record.status === 'PLANNED' && (
            <Popconfirm
              title="Mark as in transit?"
              onConfirm={() => handleStatusUpdate(record.id, 'IN_TRANSIT')}
            >
              <Button type="link" size="small">Dispatch</Button>
            </Popconfirm>
          )}
          {record.status === 'IN_TRANSIT' && (
            <Popconfirm
              title="Mark as delivered?"
              onConfirm={() => handleStatusUpdate(record.id, 'DELIVERED')}
            >
              <Button type="link" size="small">Deliver</Button>
            </Popconfirm>
          )}
          {(record.status === 'PLANNED' || record.status === 'IN_TRANSIT') && (
            <Popconfirm
              title="Cancel this shipment?"
              onConfirm={() => handleStatusUpdate(record.id, 'CANCELLED')}
            >
              <Button type="link" size="small" danger>Cancel</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Shipments</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchShipments}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Create Shipment
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={shipments}
        loading={loading}
        pagination={{ pageSize: 15, showSizeChanger: true }}
        scroll={{ x: 1400 }}
        size="middle"
      />

      <Modal
        title="Create Shipment"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="origin_vault_id" label="Origin Vault" rules={[{ required: true, message: 'Select origin' }]}>
            <Select
              placeholder="Select origin vault"
              options={vaults.filter((v) => v.is_active).map((v) => ({ label: `${v.name} (${v.code})`, value: v.id }))}
            />
          </Form.Item>
          <Form.Item name="destination_vault_id" label="Destination Vault" rules={[{ required: true, message: 'Select destination' }]}>
            <Select
              placeholder="Select destination vault"
              options={vaults.filter((v) => v.is_active).map((v) => ({ label: `${v.name} (${v.code})`, value: v.id }))}
            />
          </Form.Item>
          <Form.Item name="gold_item_ids" label="Gold Items" rules={[{ required: true, message: 'Select items to ship' }]}>
            <Select
              mode="multiple"
              placeholder="Select items"
              options={availableItems.map((item) => ({
                label: `${item.serial_number} — ${formatNumber(item.weight_oz)} oz`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="carrier" label="Carrier">
            <Input placeholder="e.g. Brinks, Loomis" />
          </Form.Item>
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="departure_date" label="Departure Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="estimated_arrival" label="Estimated Arrival" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="insurance_value" label="Insurance Value (USD)">
            <InputNumber min={0} step={10000} precision={2} style={{ width: '100%' }} />
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
