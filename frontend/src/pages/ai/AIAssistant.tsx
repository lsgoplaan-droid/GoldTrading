import { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Spin,
  Tag,
  Typography,
  Row,
  Col,
  Descriptions,
  List,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { sendChatMessage, getSLMInfo } from '../../api/slmApi';
import { ChatMessage, ChatResponse, SLMInfo } from '../../types/slm';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
  model?: string;
  suggestions?: string[];
  context_used?: {
    current_price: number;
    net_position_oz: number;
    active_alerts: number;
  };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState<SLMInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    getSLMInfo().then(setModelInfo).catch(() => {});
    handleSend('hello');
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg: DisplayMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const isAutoGreet = text === 'hello' && messages.length === 0;
    if (!isAutoGreet) {
      setMessages((prev) => [...prev, userMsg]);
    }
    setInput('');
    setLoading(true);

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      const response: ChatResponse = await sendChatMessage(messageText, history);

      const assistantMsg: DisplayMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        intent: response.intent,
        confidence: response.confidence,
        model: response.model,
        suggestions: response.suggestions,
        context_used: response.context_used,
      };

      setMessages((prev) => (isAutoGreet ? [assistantMsg] : [...prev, assistantMsg]));
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the backend. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: suggestion, timestamp: new Date().toISOString() },
    ]);
    handleSend(suggestion);
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <RobotOutlined style={{ marginRight: 8 }} />
        AI Trading Assistant
        <Tag color="purple" style={{ marginLeft: 12, fontSize: 12, verticalAlign: 'middle' }}>
          SLM POC
        </Tag>
      </Title>

      <Row gutter={24}>
        {/* Chat Panel */}
        <Col xs={24} lg={16}>
          <Card
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: 600 } }}
          >
            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                background: '#fafafa',
              }}
            >
              {messages.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: 10,
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1677ff, #0958d9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <RobotOutlined style={{ color: '#fff', fontSize: 18 }} />
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '12px 16px',
                        borderRadius:
                          msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.role === 'user' ? '#1677ff' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#333',
                        fontSize: 14,
                        lineHeight: 1.6,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="slm-markdown">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}

                      {msg.role === 'assistant' && (msg.intent || msg.confidence || msg.context_used) && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 8,
                            borderTop: '1px solid #f0f0f0',
                            display: 'flex',
                            gap: 4,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          {msg.intent && (
                            <Tag color="blue" style={{ fontSize: 11 }}>
                              Intent: {msg.intent}
                            </Tag>
                          )}
                          {msg.confidence && (
                            <Tag color="green" style={{ fontSize: 11 }}>
                              Confidence: {(msg.confidence * 100).toFixed(0)}%
                            </Tag>
                          )}
                          {msg.context_used && (
                            <Tag color="orange" style={{ fontSize: 11 }}>
                              Price: ${msg.context_used.current_price.toFixed(2)}
                            </Tag>
                          )}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#52c41a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <UserOutlined style={{ color: '#fff', fontSize: 18 }} />
                      </div>
                    )}
                  </div>

                  {/* Suggestions for last assistant message */}
                  {msg.role === 'assistant' && msg.suggestions && idx === messages.length - 1 && (
                    <div
                      style={{
                        marginTop: 10,
                        marginLeft: 46,
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      {msg.suggestions.map((s, si) => (
                        <Button
                          key={si}
                          size="small"
                          onClick={() => handleSuggestionClick(s)}
                          style={{ borderRadius: 16, fontSize: 12 }}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1677ff, #0958d9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RobotOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div
                    style={{
                      padding: '12px 20px',
                      background: '#fff',
                      borderRadius: 16,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Spin size="small" />
                    <Text style={{ marginLeft: 10, color: '#999' }}>Analyzing your data...</Text>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                gap: 8,
              }}
            >
              <Input
                size="large"
                placeholder="Ask about portfolio, risk, trades, logistics, gold price..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPressEnter={() => handleSend()}
                disabled={loading}
                style={{ borderRadius: 24 }}
              />
              <Button
                type="primary"
                size="large"
                shape="circle"
                icon={<SendOutlined />}
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
              />
            </div>
          </Card>
        </Col>

        {/* Model Info Panel */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                Model Information
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            {modelInfo ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Model">{modelInfo.model_name}</Descriptions.Item>
                <Descriptions.Item label="Type">{modelInfo.model_type}</Descriptions.Item>
                <Descriptions.Item label="Version">{modelInfo.version}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Spin size="small" />
            )}
          </Card>

          <Card
            title={
              <span>
                <ExperimentOutlined style={{ marginRight: 8 }} />
                Capabilities
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            {modelInfo ? (
              <List
                size="small"
                dataSource={modelInfo.capabilities}
                renderItem={(item) => (
                  <List.Item style={{ padding: '6px 0', fontSize: 13 }}>• {item}</List.Item>
                )}
              />
            ) : (
              <Spin size="small" />
            )}
          </Card>

          <Card title="About This POC">
            <Paragraph style={{ fontSize: 13, color: '#666' }}>
              This demonstrates how a <strong>Small Language Model (SLM)</strong> can be integrated
              into a banking application for domain-specific AI assistance.
            </Paragraph>
            <Paragraph style={{ fontSize: 13, color: '#666' }}>
              The current implementation uses <strong>rule-based intent classification</strong> and{' '}
              <strong>template-driven response generation</strong> with real-time portfolio data.
            </Paragraph>
            <Paragraph style={{ fontSize: 13, color: '#666', marginBottom: 0 }}>
              In production, this would be replaced with a fine-tuned SLM such as{' '}
              <strong>Microsoft Phi-2</strong>, <strong>TinyLlama</strong>, or a domain-specific
              model trained on financial data.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
