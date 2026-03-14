import { Menu } from 'antd';
import {
  DashboardOutlined,
  SwapOutlined,
  BankOutlined,
  SafetyOutlined,
  TeamOutlined,
  GoldOutlined,
  CarOutlined,
  LinkOutlined,
  WarningOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    {
      key: 'trading',
      icon: <SwapOutlined />,
      label: 'Trading',
      children: [
        { key: '/trading/blotter', icon: <SwapOutlined />, label: 'Trade Blotter' },
        { key: '/trading/new', icon: <SwapOutlined />, label: 'New Trade' },
        { key: '/trading/positions', icon: <BarChartOutlined />, label: 'Positions & P&L' },
        { key: '/trading/counterparties', icon: <TeamOutlined />, label: 'Counterparties' },
      ],
    },
    {
      key: 'logistics',
      icon: <BankOutlined />,
      label: 'Logistics',
      children: [
        { key: '/logistics/vaults', icon: <BankOutlined />, label: 'Vaults' },
        { key: '/logistics/inventory', icon: <GoldOutlined />, label: 'Gold Inventory' },
        { key: '/logistics/shipments', icon: <CarOutlined />, label: 'Shipments' },
        { key: '/logistics/allocations', icon: <LinkOutlined />, label: 'Allocations' },
      ],
    },
    {
      key: 'risk',
      icon: <SafetyOutlined />,
      label: 'Risk Management',
      children: [
        { key: '/risk/dashboard', icon: <SafetyOutlined />, label: 'Risk Dashboard' },
        { key: '/risk/limits', icon: <WarningOutlined />, label: 'Limits' },
        { key: '/risk/stress-tests', icon: <ThunderboltOutlined />, label: 'Stress Tests' },
        { key: '/risk/alerts', icon: <AlertOutlined />, label: 'Alerts' },
      ],
    },
  ];

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      defaultOpenKeys={['trading', 'logistics', 'risk']}
      items={items}
      onClick={({ key }) => navigate(key)}
      style={{ borderRight: 0 }}
    />
  );
}
