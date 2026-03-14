import { Layout, Typography, Space, Tag } from 'antd';
import { GoldOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { formatCurrency } from '../../utils/formatters';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const { price } = useGoldPrice();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: '#001529',
      }}>
        <Space>
          <GoldOutlined style={{ fontSize: 24, color: '#faad14' }} />
          <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
            Gold Trading Platform
          </Typography.Title>
        </Space>
        {price && (
          <Space>
            <Tag color="gold" style={{ fontSize: 16, padding: '4px 12px' }}>
              XAU/USD: {formatCurrency(price.price)}
            </Tag>
            {price.change !== null && (
              <Tag color={price.change >= 0 ? 'green' : 'red'} style={{ fontSize: 14 }}>
                {price.change >= 0 ? '+' : ''}{price.change?.toFixed(2)}
                {' '}({price.change_pct?.toFixed(2)}%)
              </Tag>
            )}
          </Space>
        )}
      </Header>
      <Layout>
        <Sider width={240} style={{ background: '#fff' }}>
          <Sidebar />
        </Sider>
        <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
