import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
  Space,
  Tag,
  Progress,
  Statistic,
  message,
  Spin,
} from 'antd';
import { PlusOutlined, BankOutlined } from '@ant-design/icons';
import { getVaults, createVault } from '../../api/logisticsApi';
import { Vault } from '../../types';
import { formatNumber } from '../../utils/formatters';

const { Title, Text } = Typography;

export default function Vaults() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchVaults = async () => {
    setLoading(true);
    try {
      const res = await getVaults();
      setVaults(res.data);
    } catch {
      message.error('Failed to load vaults');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaults();
  }, []);

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await createVault({
        name: values.name as string,
        code: values.code as string,
        location: values.location as string,
        operator: values.operator as string | undefined,
        capacity_oz: values.capacity_oz as number | undefined,
      });
      message.success('Vault created');
      setModalOpen(false);
      form.resetFields();
      fetchVaults();
    } catch {
      message.error('Failed to create vault');
    } finally {
      setSubmitting(false);
    }
  };

  const capacityPct = (vault: Vault) =>
    vault.capacity_oz > 0
      ? Math.round((vault.current_holdings_oz / vault.capacity_oz) * 100)
      : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Vaults</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add Vault
        </Button>
      </div>

      {loading ? (
        <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 64 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {vaults.map((vault) => (
            <Col xs={24} sm={12} lg={8} key={vault.id}>
              <Card
                title={
                  <Space>
                    <BankOutlined />
                    <span>{vault.name}</span>
                    <Tag color={vault.is_active ? 'green' : 'red'}>
                      {vault.is_active ? 'Active' : 'Inactive'}
                    </Tag>
                  </Space>
                }
                extra={<Text type="secondary">{vault.code}</Text>}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Holdings"
                      value={vault.current_holdings_oz}
                      precision={2}
                      suffix="oz"
                      valueStyle={{ fontSize: 18 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Items"
                      value={vault.item_count}
                      valueStyle={{ fontSize: 18 }}
                    />
                  </Col>
                </Row>

                <div style={{ marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Capacity: {formatNumber(vault.current_holdings_oz)} / {formatNumber(vault.capacity_oz)} oz
                  </Text>
                  <Progress
                    percent={capacityPct(vault)}
                    strokeColor={capacityPct(vault) > 90 ? '#cf1322' : capacityPct(vault) > 70 ? '#faad14' : '#52c41a'}
                    size="small"
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Location: </Text>
                  <Text>{vault.location}</Text>
                </div>
                {vault.operator && (
                  <div>
                    <Text type="secondary">Operator: </Text>
                    <Text>{vault.operator}</Text>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="Add Vault"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Vault Name" rules={[{ required: true, message: 'Enter name' }]}>
            <Input placeholder="e.g. London Main Vault" />
          </Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Enter code' }]}>
            <Input placeholder="e.g. LDN-01" />
          </Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true, message: 'Enter location' }]}>
            <Input placeholder="e.g. London, UK" />
          </Form.Item>
          <Form.Item name="operator" label="Operator">
            <Input placeholder="e.g. Brinks" />
          </Form.Item>
          <Form.Item name="capacity_oz" label="Capacity (oz)">
            <InputNumber min={0} step={1000} style={{ width: '100%' }} />
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
