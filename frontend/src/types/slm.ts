export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  intent: string;
  confidence: number;
  model: string;
  suggestions: string[];
  timestamp: string;
  context_used: {
    current_price: number;
    net_position_oz: number;
    active_alerts: number;
  };
}

export interface SLMInfo {
  model_name: string;
  model_type: string;
  version: string;
  capabilities: string[];
  description: string;
}
