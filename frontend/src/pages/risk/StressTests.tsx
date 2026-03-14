import { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Spin, Alert, Button, Modal, Form, Input, InputNumber, Descriptions, Tag } from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { getStressScenarios, createStressScenario, runStressTest } from '../../api/riskApi';
import { StressScenario, StressTestResult } from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

const { Title, Text } = Typography;

export default function StressTests() {
  const [scenarios, setScenarios] = useState<StressScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<StressTestResult | null>(null);
  const [form] = Form.useForm();

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const res = await getStressScenarios();
      setScenarios(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stress scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      setSubmitting(true);
      await createStressScenario({
        name: values.name,
        price_shock_pct: values.price_shock_pct,
        description: values.description,
      });
      setModalOpen(false);
      form.resetFields();
      await fetchScenarios();
    } catch (err: any) {
      setError(err.message || 'Failed to create scenario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRun = async (id: number) => {
    try {
      setRunningId(id);
      const res = await runStressTest(id);
      setTestResult(res.data);
      setResultModalOpen(true);
      await fetchScenarios();
    } catch (err: any) {
      setError(err.message || 'Failed to run stress test');
    } finally {
      setRunningId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Stress Tests</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add Scenario
        </Button>
      </div>

      {error && <Alert type="error" message={error} showIcon closable style={{ marginBottom: 16 }} onClose={() => setError(null)} />}

      <Row gutter={[16, 16]}>
        {scenarios.length === 0 ? (
          <Col span={24}>
            <Alert message="No stress scenarios configured" type="info" showIcon />
          </Col>
        ) : (
          scenarios.map((scenario) => (
            <Col xs={24} sm={12} lg={8} key={scenario.id}>
              <Card
                title={scenario.name}
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    loading={runningId === scenario.id}
                    onClick={() => handleRun(scenario.id)}
                  >
                    Run
                  </Button>
                }
              >
                {scenario.description && (
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    {scenario.description}
                  </Text>
                )}
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Shock">
                    <Tag color={scenario.price_shock_pct < 0 ? 'red' : 'green'}>
                      {scenario.price_shock_pct >= 0 ? '+' : ''}
                      {formatNumber(scenario.price_shock_pct, 1)}%
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Result P&L">
                    {scenario.result_pnl !== null ? (
                      <span style={{ color: scenario.result_pnl >= 0 ? '#3f8600' : '#cf1322', fontWeight: 600 }}>
                        {formatCurrency(scenario.result_pnl)}
                      </span>
                    ) : (
                      <Text type="secondary">Not run yet</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Run">
                    {scenario.last_run_at ? formatDate(scenario.last_run_at) : <Text type="secondary">Never</Text>}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Add Scenario Modal */}
      <Modal
        title="Add Stress Scenario"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Scenario Name"
            rules={[{ required: true, message: 'Please enter a scenario name' }]}
          >
            <Input placeholder="e.g. 2008 Financial Crisis" />
          </Form.Item>
          <Form.Item
            name="price_shock_pct"
            label="Price Shock (%)"
            rules={[{ required: true, message: 'Please enter the shock percentage' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              step={0.5}
              formatter={(value) => `${value}%`}
              parser={(value) => value?.replace('%', '') as any}
              placeholder="-20"
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Describe the scenario..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Create Scenario
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Test Result Modal */}
      <Modal
        title="Stress Test Result"
        open={resultModalOpen}
        onCancel={() => setResultModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setResultModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {testResult && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Scenario">{testResult.scenario_name}</Descriptions.Item>
            <Descriptions.Item label="Price Shock">
              <Tag color={testResult.price_shock_pct < 0 ? 'red' : 'green'}>
                {testResult.price_shock_pct >= 0 ? '+' : ''}
                {formatNumber(testResult.price_shock_pct, 1)}%
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Current Price">{formatCurrency(testResult.current_price)}</Descriptions.Item>
            <Descriptions.Item label="Shocked Price">{formatCurrency(testResult.shocked_price)}</Descriptions.Item>
            <Descriptions.Item label="P&L Impact">
              <span style={{ color: testResult.pnl_impact >= 0 ? '#3f8600' : '#cf1322', fontWeight: 600, fontSize: 16 }}>
                {formatCurrency(testResult.pnl_impact)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Positions Affected">{testResult.positions_affected}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
