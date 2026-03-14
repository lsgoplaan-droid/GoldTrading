import React, { useEffect, useState } from 'react';
import { Table, Card, Row, Col, Statistic, Typography, message, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getPositions, getPnL } from '../../api/tradingApi';
import { Position, PnLSummary } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const { Title } = Typography;

export default function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [pnl, setPnl] = useState<PnLSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [posRes, pnlRes] = await Promise.all([getPositions(), getPnL()]);
        setPositions(posRes.data);
        setPnl(pnlRes.data);
      } catch {
        message.error('Failed to load position data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns: ColumnsType<Position> = [
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: 'Net Qty (oz)',
      dataIndex: 'net_quantity_oz',
      key: 'net_quantity_oz',
      align: 'right',
      render: (val: number) => formatNumber(val),
      sorter: (a, b) => a.net_quantity_oz - b.net_quantity_oz,
    },
    {
      title: 'Avg Cost',
      dataIndex: 'avg_cost_per_oz',
      key: 'avg_cost_per_oz',
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Current Price',
      dataIndex: 'current_price',
      key: 'current_price',
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Unrealized P&L',
      dataIndex: 'unrealized_pnl',
      key: 'unrealized_pnl',
      align: 'right',
      render: (val: number) => (
        <span style={{ color: val >= 0 ? '#3f8600' : '#cf1322', fontWeight: 600 }}>
          {formatCurrency(val)}
        </span>
      ),
      sorter: (a, b) => a.unrealized_pnl - b.unrealized_pnl,
    },
    {
      title: 'Total Value',
      dataIndex: 'total_value',
      key: 'total_value',
      align: 'right',
      render: (val: number) => formatCurrency(val),
      sorter: (a, b) => a.total_value - b.total_value,
    },
  ];

  const pnlColor = (val: number) => (val >= 0 ? '#3f8600' : '#cf1322');
  const pnlIcon = (val: number) =>
    val >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Positions</Title>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={positions}
        loading={loading}
        pagination={false}
        size="middle"
        style={{ marginBottom: 32 }}
      />

      <Title level={4}>P&amp;L Summary</Title>
      {pnl ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Realized P&L"
                value={pnl.total_realized_pnl}
                precision={2}
                prefix="$"
                valueStyle={{ color: pnlColor(pnl.total_realized_pnl) }}
                suffix={pnlIcon(pnl.total_realized_pnl)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Unrealized P&L"
                value={pnl.total_unrealized_pnl}
                precision={2}
                prefix="$"
                valueStyle={{ color: pnlColor(pnl.total_unrealized_pnl) }}
                suffix={pnlIcon(pnl.total_unrealized_pnl)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total P&L"
                value={pnl.total_pnl}
                precision={2}
                prefix="$"
                valueStyle={{ color: pnlColor(pnl.total_pnl) }}
                suffix={pnlIcon(pnl.total_pnl)}
              />
            </Card>
          </Col>
        </Row>
      ) : (
        <Spin />
      )}
    </div>
  );
}
