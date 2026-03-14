import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  DatePicker,
  Button,
  Card,
  Typography,
  Space,
  message,
  Statistic,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { createTrade, getCounterparties } from '../../api/tradingApi';
import { getCurrentPrice } from '../../api/priceApi';
import { Counterparty } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

export default function NewTrade() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    getCounterparties()
      .then((res) => setCounterparties(res.data))
      .catch(() => message.error('Failed to load counterparties'));

    getCurrentPrice()
      .then((res) => {
        setCurrentPrice(res.data.price);
        form.setFieldsValue({ price_per_oz: res.data.price });
        recalcTotal(form.getFieldValue('quantity_oz'), res.data.price);
      })
      .catch(() => message.warning('Could not fetch current gold price'));
  }, []);

  const recalcTotal = (qty?: number, price?: number) => {
    const q = qty ?? 0;
    const p = price ?? 0;
    setTotalValue(q * p);
  };

  const handleValuesChange = (_: unknown, allValues: Record<string, unknown>) => {
    recalcTotal(allValues.quantity_oz as number, allValues.price_per_oz as number);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await createTrade({
        trade_type: values.trade_type as string,
        product_type: values.product_type as string,
        counterparty_id: values.counterparty_id as number,
        quantity_oz: values.quantity_oz as number,
        price_per_oz: values.price_per_oz as number,
        trade_date: (values.trade_date as dayjs.Dayjs).format('YYYY-MM-DD'),
        settlement_date: (values.settlement_date as dayjs.Dayjs).format('YYYY-MM-DD'),
        notes: (values.notes as string) || undefined,
      });
      message.success('Trade created successfully');
      navigate('/trading/blotter');
    } catch {
      message.error('Failed to create trade');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Title level={3}>New Trade</Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          initialValues={{
            trade_type: 'BUY',
            product_type: 'SPOT',
            trade_date: dayjs(),
            settlement_date: dayjs().add(2, 'day'),
          }}
        >
          <Form.Item
            name="trade_type"
            label="Trade Type"
            rules={[{ required: true, message: 'Select trade type' }]}
          >
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="BUY">BUY</Radio.Button>
              <Radio.Button value="SELL">SELL</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="product_type"
            label="Product Type"
            rules={[{ required: true, message: 'Select product type' }]}
          >
            <Select
              options={[
                { label: 'Spot', value: 'SPOT' },
                { label: 'Forward', value: 'FORWARD' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="counterparty_id"
            label="Counterparty"
            rules={[{ required: true, message: 'Select a counterparty' }]}
          >
            <Select
              showSearch
              placeholder="Select counterparty"
              optionFilterProp="label"
              options={counterparties
                .filter((c) => c.is_active)
                .map((c) => ({ label: `${c.name} (${c.code})`, value: c.id }))}
            />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="quantity_oz"
              label="Quantity (oz)"
              rules={[{ required: true, message: 'Enter quantity' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0.01} step={1} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="price_per_oz"
              label="Price per oz (USD)"
              rules={[{ required: true, message: 'Enter price' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0.01} step={0.5} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Card
            size="small"
            style={{ marginBottom: 24, background: '#fafafa' }}
          >
            <Statistic
              title="Total Value"
              value={totalValue}
              precision={2}
              prefix="$"
            />
            {currentPrice && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Current market price: {formatCurrency(currentPrice)}
              </Typography.Text>
            )}
          </Card>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="trade_date"
              label="Trade Date"
              rules={[{ required: true, message: 'Select trade date' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="settlement_date"
              label="Settlement Date"
              rules={[{ required: true, message: 'Select settlement date' }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Optional notes..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Submit Trade
              </Button>
              <Button onClick={() => navigate('/trading/blotter')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
