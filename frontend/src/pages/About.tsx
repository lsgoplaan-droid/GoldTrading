import { Typography, Card, Row, Col, Tag, Divider, Space } from 'antd';
import {
  SwapOutlined,
  BankOutlined,
  SafetyOutlined,
  RobotOutlined,
  DashboardOutlined,
  LineChartOutlined,
  GoldOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const features = [
  {
    icon: <DashboardOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    title: 'Real-Time Dashboard',
    description:
      'Centralized view of key performance indicators including net position, unrealized P&L, Value at Risk, and total inventory with live XAU/USD price tracking.',
  },
  {
    icon: <SwapOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    title: 'Trade Management',
    description:
      'Full trade lifecycle management — create, confirm, settle, and cancel trades. Includes a trade blotter with status filtering, position tracking, and P&L analysis.',
  },
  {
    icon: <BankOutlined style={{ fontSize: 28, color: '#faad14' }} />,
    title: 'Logistics & Inventory',
    description:
      'Manage physical vaults, track gold inventory across locations, monitor shipments in transit, and handle allocation of gold bars to client accounts.',
  },
  {
    icon: <SafetyOutlined style={{ fontSize: 28, color: '#f5222d' }} />,
    title: 'Risk Management',
    description:
      'Comprehensive risk controls with VaR calculations (95% & 99% confidence), exposure breakdown, risk limit monitoring, stress testing, and real-time alerts.',
  },
  {
    icon: <GoldOutlined style={{ fontSize: 28, color: '#d4af37' }} />,
    title: 'Counterparty Management',
    description:
      'Maintain counterparty profiles, track credit limits, and manage trading relationships with banks, refiners, and institutional clients.',
  },
  {
    icon: <LineChartOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
    title: 'Charts & Visualization',
    description:
      'Interactive charts for gold price history, exposure breakdown, and risk limit utilization — enabling data-driven decision-making at a glance.',
  },
  {
    icon: <ThunderboltOutlined style={{ fontSize: 28, color: '#eb2f96' }} />,
    title: 'Stress Testing',
    description:
      'Run scenario-based stress tests to evaluate portfolio resilience under adverse market conditions and ensure preparedness for extreme price movements.',
  },
  {
    icon: <RobotOutlined style={{ fontSize: 28, color: '#13c2c2' }} />,
    title: 'AI-Powered Assistant',
    description:
      'Integrated AI chat assistant powered by a Small Language Model (SLM) with intent detection, confidence scoring, and real-time portfolio context injection.',
  },
];

const techStack = [
  { label: 'React 19', color: 'cyan' },
  { label: 'TypeScript', color: 'blue' },
  { label: 'Ant Design', color: 'geekblue' },
  { label: 'Recharts', color: 'purple' },
  { label: 'FastAPI', color: 'green' },
  { label: 'Python', color: 'gold' },
  { label: 'SQLite', color: 'orange' },
  { label: 'React Router', color: 'red' },
];

export default function About() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <GoldOutlined style={{ fontSize: 48, color: '#d4af37' }} />
        </div>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 4 }}>
          Gold Trading, Logistics & Risk Management
        </Title>
        <Paragraph style={{ textAlign: 'center', fontSize: 16, color: '#666' }}>
          A comprehensive proof-of-concept platform for managing the complete gold trading lifecycle
          — from trade execution and physical logistics to risk monitoring and AI-assisted insights.
        </Paragraph>
        <Divider />
        <Paragraph style={{ textAlign: 'center' }}>
          <Text type="secondary">Developed for</Text>
          <br />
          <Text strong style={{ fontSize: 20 }}>
            Finsurge
          </Text>
        </Paragraph>
      </Card>

      <Title level={3} style={{ marginBottom: 16 }}>
        Platform Features
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {features.map((feature) => (
          <Col xs={24} sm={12} lg={8} key={feature.title}>
            <Card hoverable style={{ height: '100%' }}>
              <Space direction="vertical" size={8}>
                {feature.icon}
                <Title level={5} style={{ margin: 0 }}>
                  {feature.title}
                </Title>
                <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
                  {feature.description}
                </Paragraph>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={3} style={{ marginBottom: 16 }}>
        Technology Stack
      </Title>
      <Card style={{ marginBottom: 32 }}>
        <Space size={[8, 8]} wrap>
          {techStack.map((tech) => (
            <Tag key={tech.label} color={tech.color} style={{ fontSize: 14, padding: '4px 12px' }}>
              {tech.label}
            </Tag>
          ))}
        </Space>
      </Card>

      <Card>
        <Paragraph type="secondary" style={{ textAlign: 'center', margin: 0, fontSize: 13 }}>
          This platform is a proof-of-concept (POC) developed to demonstrate end-to-end gold
          trading capabilities including trade management, physical logistics, risk analytics, and
          AI-driven insights. Not intended for production use without further hardening and
          compliance review.
        </Paragraph>
      </Card>
    </div>
  );
}
