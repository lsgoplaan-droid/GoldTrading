import { useState, useRef, useEffect } from 'react';
import { Button, Input, Spin, Badge, Tag, Typography } from 'antd';
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sendChatMessage } from '../../api/slmApi';
import { ChatMessage, ChatResponse } from '../../types/slm';
import ReactMarkdown from 'react-markdown';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
  suggestions?: string[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleSend('hello');
    }
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg: DisplayMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    if (!text) {
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
        suggestions: response.suggestions,
      };

      setMessages((prev) => (text ? [assistantMsg] : [...prev, assistantMsg]));
    } catch {
      const errorMsg: DisplayMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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

  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Badge count={0} offset={[-4, 4]}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            onClick={() => setIsOpen(true)}
            style={{
              width: 56,
              height: 56,
              fontSize: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
            }}
          />
        </Badge>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 400,
        height: 550,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        background: '#fff',
        border: '1px solid #e8e8e8',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RobotOutlined style={{ fontSize: 20 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Gold AI Assistant</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>GoldSLM-v1 (POC)</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            type="text"
            size="small"
            icon={<ExpandOutlined />}
            onClick={() => navigate('/ai/assistant')}
            style={{ color: '#fff' }}
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setIsOpen(false)}
            style={{ color: '#fff' }}
          />
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          background: '#f5f5f5',
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 8,
              }}
            >
              {msg.role === 'assistant' && (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#1677ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <RobotOutlined style={{ color: '#fff', fontSize: 14 }} />
                </div>
              )}
              <div
                style={{
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? '#1677ff' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                }}
              >
                {msg.role === 'assistant' ? (
                  <div className="slm-markdown">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
                {msg.role === 'assistant' && msg.intent && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                      {msg.intent}
                    </Tag>
                    {msg.confidence && (
                      <Tag color="green" style={{ fontSize: 10, margin: 0 }}>
                        {(msg.confidence * 100).toFixed(0)}% conf
                      </Tag>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#52c41a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <UserOutlined style={{ color: '#fff', fontSize: 14 }} />
                </div>
              )}
            </div>

            {/* Suggestions */}
            {msg.role === 'assistant' && msg.suggestions && idx === messages.length - 1 && (
              <div style={{ marginTop: 8, marginLeft: 36, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {msg.suggestions.map((s, si) => (
                  <Button
                    key={si}
                    size="small"
                    onClick={() => handleSuggestionClick(s)}
                    style={{ fontSize: 11, borderRadius: 12 }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#1677ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RobotOutlined style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <div style={{ padding: '8px 16px', background: '#fff', borderRadius: 12 }}>
              <Spin size="small" />
              <Typography.Text style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>
                Analyzing...
              </Typography.Text>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid #e8e8e8',
          background: '#fff',
          display: 'flex',
          gap: 8,
        }}
      >
        <Input
          placeholder="Ask about your portfolio, risk, trades..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => handleSend()}
          disabled={loading}
          style={{ borderRadius: 20 }}
        />
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined />}
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        />
      </div>
    </div>
  );
}
