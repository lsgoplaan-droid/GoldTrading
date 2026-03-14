import { Tag } from 'antd';

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  CONFIRMED: 'blue',
  SETTLED: 'green',
  CANCELLED: 'red',
  AVAILABLE: 'green',
  ALLOCATED: 'blue',
  IN_TRANSIT: 'orange',
  RESERVED: 'purple',
  PLANNED: 'default',
  DELIVERED: 'green',
  BUY: 'green',
  SELL: 'red',
  LOW: 'blue',
  MEDIUM: 'orange',
  HIGH: 'red',
  CRITICAL: 'magenta',
};

export default function StatusTag({ status }: { status: string }) {
  return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
}
