import { PriceHistoryPoint } from '../../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface GoldPriceChartProps {
  data: PriceHistoryPoint[];
  height?: number;
}

const formatXAxis = (timestamp: string) => {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          padding: '8px 12px',
        }}
      >
        <p style={{ margin: 0, color: '#888', fontSize: 12 }}>
          {new Date(label).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <p style={{ margin: 0, fontWeight: 600, color: '#d4a017' }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function GoldPriceChart({ data, height = 300 }: GoldPriceChartProps) {
  const prices = data.map((p) => p.price);
  const minPrice = prices.length ? Math.floor(Math.min(...prices) * 0.999) : 0;
  const maxPrice = prices.length ? Math.ceil(Math.max(...prices) * 1.001) : 0;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d4a017" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#d4a017" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatXAxis}
          tick={{ fontSize: 12 }}
          stroke="#999"
        />
        <YAxis
          domain={[minPrice, maxPrice]}
          tickFormatter={(v: number) => `$${v.toLocaleString()}`}
          tick={{ fontSize: 12 }}
          stroke="#999"
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#d4a017"
          strokeWidth={2}
          fill="url(#goldGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
