import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Typography, Spin, Alert, List } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getDashboardSummary, getAlerts } from '../api/riskApi';
import { getPriceHistory } from '../api/priceApi';
import { getTrades } from '../api/tradingApi';
import { DashboardSummary, PriceHistoryPoint, Trade, RiskAlert } from '../types';
import MetricCard from '../components/common/MetricCard';
import StatusTag from '../components/common/StatusTag';
import GoldPriceChart from '../components/charts/GoldPriceChart';
import { formatCurrency, formatDate, formatNumber, formatWeight } from '../utils/formatters';

const { Title } = Typography;

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, priceRes, tradesRes, alertsRes] = await Promise.all([
          getDashboardSummary(),
          getPriceHistory(30),
          getTrades(),
          getAlerts(undefined, false),
        ]);
        setSummary(summaryRes.data);
        setPriceHistory(priceRes.data);
        setRecentTrades(tradesRes.data.slice(0, 5));
        setAlerts(alertsRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const tradeColumns: ColumnsType<Trade> = [
    {
      title: 'Ref',
      dataIndex: 'trade_ref',
      key: 'trade_ref',
      width: 120,
    },
    {
      title: 'Type',
      dataIndex: 'trade_type',
      key: 'trade_type',
      width: 80,
      render: (type: string) => <StatusTag status={type} />,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity_oz',
      key: 'quantity_oz',
      width: 100,
      align: 'right',
      render: (val: number) => formatWeight(val),
    },
    {
      title: 'Price',
      dataIndex: 'price_per_oz',
      key: 'price_per_oz',
      width: 120,
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'Date',
      dataIndex: 'trade_date',
      key: 'trade_date',
      width: 120,
      render: (val: string) => formatDate(val),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message="Error" description={error} showIcon />;
  }

  return (
    <div>
      <Title level={3}>Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Net Position"
            value={summary?.net_position_oz ?? 0}
            suffix="oz"
            precision={2}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Unrealized P&L"
            value={summary?.unrealized_pnl ?? 0}
            prefix="$"
            precision={2}
            color={(summary?.unrealized_pnl ?? 0) >= 0 ? '#3f8600' : '#cf1322'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="1-Day VaR 95%"
            value={summary?.var_95 ?? 0}
            prefix="$"
            precision={2}
            color="#cf1322"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Inventory"
            value={summary?.total_inventory_oz ?? 0}
            suffix="oz"
            precision={2}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Gold Price - 30 Day History">
            <GoldPriceChart data={priceHistory} height={350} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={`Active Alerts (${alerts.length})`}
            style={{ height: '100%' }}
            bodyStyle={{ maxHeight: 380, overflow: 'auto' }}
          >
            {alerts.length === 0 ? (
              <Alert message="No active alerts" type="success" showIcon />
            ) : (
              <List
                size="small"
                dataSource={alerts}
                renderItem={(alert) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <span>
                          <StatusTag status={alert.severity} />{' '}
                          {alert.alert_type}
                        </span>
                      }
                      description={
                        <>
                          <div>{alert.message}</div>
                          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                            {formatDate(alert.created_at)}
                          </div>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Recent Trades">
            <Table
              columns={tradeColumns}
              dataSource={recentTrades}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
