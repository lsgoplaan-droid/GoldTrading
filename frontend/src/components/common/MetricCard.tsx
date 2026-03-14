import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface MetricCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  precision?: number;
  trend?: number;
  color?: string;
}

export default function MetricCard({ title, value, prefix, suffix, precision = 2, trend, color }: MetricCardProps) {
  const valueColor = color || (typeof trend === 'number' ? (trend >= 0 ? '#3f8600' : '#cf1322') : undefined);

  return (
    <Card size="small" style={{ height: '100%' }}>
      <Statistic
        title={title}
        value={value}
        precision={typeof value === 'number' ? precision : undefined}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color: valueColor, fontSize: 24 }}
      />
      {typeof trend === 'number' && (
        <span style={{ color: trend >= 0 ? '#3f8600' : '#cf1322', fontSize: 12 }}>
          {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {' '}{Math.abs(trend).toFixed(2)}%
        </span>
      )}
    </Card>
  );
}
