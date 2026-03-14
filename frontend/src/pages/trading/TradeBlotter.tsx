import React, { useEffect, useState } from 'react';
import { Button, Table, Space, Select, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { getTrades, updateTradeStatus } from '../../api/tradingApi';
import { Trade } from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import StatusTag from '../../components/common/StatusTag';

const { Title } = Typography;

const TRADE_STATUSES = ['PENDING', 'CONFIRMED', 'SETTLED', 'CANCELLED'];

export default function TradeBlotter() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const res = await getTrades(statusFilter);
      setTrades(res.data);
    } catch {
      message.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [statusFilter]);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateTradeStatus(id, status);
      message.success(`Trade ${status.toLowerCase()} successfully`);
      fetchTrades();
    } catch {
      message.error(`Failed to update trade status`);
    }
  };

  const columns: ColumnsType<Trade> = [
    {
      title: 'Trade Ref',
      dataIndex: 'trade_ref',
      key: 'trade_ref',
      sorter: (a, b) => a.trade_ref.localeCompare(b.trade_ref),
    },
    {
      title: 'Date',
      dataIndex: 'trade_date',
      key: 'trade_date',
      render: (date: string) => formatDate(date),
      sorter: (a, b) => a.trade_date.localeCompare(b.trade_date),
    },
    {
      title: 'Type',
      dataIndex: 'trade_type',
      key: 'trade_type',
      render: (type: string) => <StatusTag status={type} />,
    },
    {
      title: 'Product',
      dataIndex: 'product_type',
      key: 'product_type',
    },
    {
      title: 'Counterparty',
      key: 'counterparty',
      render: (_: unknown, record: Trade) => record.counterparty?.name ?? '—',
    },
    {
      title: 'Qty (oz)',
      dataIndex: 'quantity_oz',
      key: 'quantity_oz',
      align: 'right',
      render: (val: number) => formatNumber(val),
      sorter: (a, b) => a.quantity_oz - b.quantity_oz,
    },
    {
      title: 'Price/oz',
      dataIndex: 'price_per_oz',
      key: 'price_per_oz',
      align: 'right',
      render: (val: number) => formatCurrency(val),
      sorter: (a, b) => a.price_per_oz - b.price_per_oz,
    },
    {
      title: 'Total Value',
      dataIndex: 'total_value',
      key: 'total_value',
      align: 'right',
      render: (val: number) => formatCurrency(val),
      sorter: (a, b) => a.total_value - b.total_value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Trade) => (
        <Space size="small">
          {record.status === 'PENDING' && (
            <>
              <Popconfirm
                title="Confirm this trade?"
                onConfirm={() => handleStatusUpdate(record.id, 'CONFIRMED')}
              >
                <Button type="link" size="small">
                  Confirm
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Cancel this trade?"
                onConfirm={() => handleStatusUpdate(record.id, 'CANCELLED')}
              >
                <Button type="link" size="small" danger>
                  Cancel
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'CONFIRMED' && (
            <Popconfirm
              title="Settle this trade?"
              onConfirm={() => handleStatusUpdate(record.id, 'SETTLED')}
            >
              <Button type="link" size="small">
                Settle
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Trade Blotter</Title>
        <Space>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 180 }}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={TRADE_STATUSES.map((s) => ({ label: s, value: s }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchTrades}>
            Refresh
          </Button>
          <Link to="/trading/new">
            <Button type="primary" icon={<PlusOutlined />}>
              New Trade
            </Button>
          </Link>
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={trades}
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1200 }}
        size="middle"
      />
    </div>
  );
}
