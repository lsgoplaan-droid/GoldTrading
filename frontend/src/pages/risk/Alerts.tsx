import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Typography, Spin, Alert, Button, Select, Space, Tag, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAlerts, acknowledgeAlert } from '../../api/riskApi';
import { RiskAlert } from '../../types';
import StatusTag from '../../components/common/StatusTag';
import { formatDate } from '../../utils/formatters';

const { Title } = Typography;

export default function Alerts() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | undefined>(undefined);
  const [ackFilter, setAckFilter] = useState<boolean | undefined>(undefined);
  const [ackingId, setAckingId] = useState<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAlerts(severityFilter, ackFilter);
      setAlerts(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [severityFilter, ackFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async (id: number) => {
    try {
      setAckingId(id);
      await acknowledgeAlert(id);
      message.success('Alert acknowledged');
      await fetchAlerts();
    } catch (err: any) {
      message.error(err.message || 'Failed to acknowledge alert');
    } finally {
      setAckingId(null);
    }
  };

  const columns: ColumnsType<RiskAlert> = [
    {
      title: 'Type',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 150,
      render: (val: string) => <Tag>{val}</Tag>,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => <StatusTag status={severity} />,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (val: string) => formatDate(val),
    },
    {
      title: 'Acknowledged',
      dataIndex: 'is_acknowledged',
      key: 'is_acknowledged',
      width: 120,
      align: 'center',
      render: (ack: boolean) => (
        <Tag color={ack ? 'green' : 'orange'}>{ack ? 'Yes' : 'No'}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 130,
      render: (_: any, record: RiskAlert) =>
        !record.is_acknowledged ? (
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            loading={ackingId === record.id}
            onClick={() => handleAcknowledge(record.id)}
          >
            Acknowledge
          </Button>
        ) : null,
    },
  ];

  if (error && alerts.length === 0) {
    return <Alert type="error" message="Error" description={error} showIcon />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Risk Alerts</Title>
        <Space>
          <Select
            style={{ width: 140 }}
            placeholder="Severity"
            allowClear
            value={severityFilter}
            onChange={(val) => setSeverityFilter(val)}
          >
            <Select.Option value="LOW">Low</Select.Option>
            <Select.Option value="MEDIUM">Medium</Select.Option>
            <Select.Option value="HIGH">High</Select.Option>
            <Select.Option value="CRITICAL">Critical</Select.Option>
          </Select>
          <Select
            style={{ width: 160 }}
            placeholder="Acknowledged"
            allowClear
            value={ackFilter}
            onChange={(val) => setAckFilter(val)}
          >
            <Select.Option value={false}>Unacknowledged</Select.Option>
            <Select.Option value={true}>Acknowledged</Select.Option>
          </Select>
        </Space>
      </div>

      {error && <Alert type="error" message={error} showIcon closable style={{ marginBottom: 16 }} />}

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={alerts}
            rowKey="id"
            pagination={{ pageSize: 15 }}
            size="small"
          />
        )}
      </Card>
    </div>
  );
}
