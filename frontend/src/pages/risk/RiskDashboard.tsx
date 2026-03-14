import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Typography, Spin, Alert, Statistic, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getVaR, getExposure, getRiskLimits, getMarginAccounts } from '../../api/riskApi';
import { VaRResponse, ExposureResponse, RiskLimit, MarginAccount } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const { Title } = Typography;

const DONUT_COLORS = ['#52c41a', '#f5222d', '#1890ff'];

export default function RiskDashboard() {
  const [var_, setVar] = useState<VaRResponse | null>(null);
  const [exposure, setExposure] = useState<ExposureResponse | null>(null);
  const [limits, setLimits] = useState<RiskLimit[]>([]);
  const [marginAccounts, setMarginAccounts] = useState<MarginAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [varRes, expRes, limitsRes, marginRes] = await Promise.all([
          getVaR(),
          getExposure(),
          getRiskLimits(),
          getMarginAccounts(),
        ]);
        setVar(varRes.data);
        setExposure(expRes.data);
        setLimits(limitsRes.data);
        setMarginAccounts(marginRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load risk data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const exposureChartData = exposure
    ? [
        { name: 'Gross Long', value: Math.abs(exposure.gross_long) },
        { name: 'Gross Short', value: Math.abs(exposure.gross_short) },
        { name: 'Net Exposure', value: Math.abs(exposure.net_exposure) },
      ]
    : [];

  const marginColumns: ColumnsType<MarginAccount> = [
    {
      title: 'Counterparty',
      dataIndex: 'counterparty_name',
      key: 'counterparty_name',
    },
    {
      title: 'Required Margin',
      dataIndex: 'required_margin',
      key: 'required_margin',
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Posted Margin',
      dataIndex: 'posted_margin',
      key: 'posted_margin',
      align: 'right',
      render: (val: number) => formatCurrency(val),
    },
    {
      title: 'Margin Call',
      dataIndex: 'margin_call_amount',
      key: 'margin_call_amount',
      align: 'right',
      render: (val: number) => (
        <span style={{ color: val > 0 ? '#cf1322' : '#3f8600', fontWeight: val > 0 ? 600 : 400 }}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Last Call Date',
      dataIndex: 'last_call_date',
      key: 'last_call_date',
      render: (val: string | null) =>
        val ? new Date(val).toLocaleDateString() : '-',
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
      <Title level={3}>Risk Dashboard</Title>

      {/* VaR Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="VaR 95% (1-Day)"
              value={var_?.var_95 ?? 0}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#cf1322', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="VaR 99% (1-Day)"
              value={var_?.var_99 ?? 0}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#cf1322', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Position Value"
              value={var_?.position_value ?? 0}
              prefix="$"
              precision={2}
              valueStyle={{ fontSize: 28 }}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              Horizon: {var_?.horizon_days ?? 1} day(s)
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Exposure Donut */}
        <Col xs={24} lg={12}>
          <Card title="Exposure Breakdown">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={exposureChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {exposureChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            {exposure && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <span style={{ color: '#888' }}>
                  Net Exposure: {formatNumber(exposure.net_exposure_oz)} oz at{' '}
                  {formatCurrency(exposure.current_price)}/oz
                </span>
              </div>
            )}
          </Card>
        </Col>

        {/* Limit Utilization */}
        <Col xs={24} lg={12}>
          <Card title="Limit Utilization">
            {limits.length === 0 ? (
              <Alert message="No risk limits configured" type="info" showIcon />
            ) : (
              limits.map((limit) => {
                const pct = limit.utilization_pct;
                const status = limit.breached ? 'exception' : pct >= 80 ? 'active' : 'normal';
                return (
                  <div key={limit.id} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{limit.limit_name}</span>
                      <span style={{ color: '#888', fontSize: 12 }}>
                        {formatCurrency(limit.current_value)} / {formatCurrency(limit.max_value)}
                      </span>
                    </div>
                    <Progress
                      percent={Math.min(pct, 100)}
                      status={status}
                      format={() => `${formatNumber(pct, 1)}%`}
                    />
                  </div>
                );
              })
            )}
          </Card>
        </Col>
      </Row>

      {/* Margin Accounts Table */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Margin Accounts">
            <Table
              columns={marginColumns}
              dataSource={marginAccounts}
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
