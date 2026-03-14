import apiClient from './client';
import { ChatMessage, ChatResponse, SLMInfo } from '../types/slm';

export async function sendChatMessage(
  message: string,
  conversationHistory?: ChatMessage[]
): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>('/slm/chat', {
    message,
    conversation_history: conversationHistory,
  });
  return data;
}

export async function getSLMInfo(): Promise<SLMInfo> {
  const { data } = await apiClient.get<SLMInfo>('/slm/info');
  return data;
}
