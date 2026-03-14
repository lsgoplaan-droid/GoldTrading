import apiClient from './client';
import { Trade, Counterparty, Position, PnLSummary } from '../types';

export const getTrades = (status?: string) =>
  apiClient.get<Trade[]>('/trading/trades', { params: { status } });

export const getTrade = (id: number) =>
  apiClient.get<Trade>(`/trading/trades/${id}`);

export const createTrade = (data: {
  trade_type: string;
  product_type: string;
  counterparty_id: number;
  quantity_oz: number;
  price_per_oz: number;
  trade_date: string;
  settlement_date: string;
  notes?: string;
}) => apiClient.post<Trade>('/trading/trades', data);

export const updateTradeStatus = (id: number, status: string) =>
  apiClient.patch<Trade>(`/trading/trades/${id}/status`, { status });

export const getCounterparties = () =>
  apiClient.get<Counterparty[]>('/trading/counterparties');

export const createCounterparty = (data: {
  name: string;
  code: string;
  type: string;
  credit_rating?: string;
  credit_limit?: number;
}) => apiClient.post<Counterparty>('/trading/counterparties', data);

export const getPositions = () =>
  apiClient.get<Position[]>('/trading/positions');

export const getPnL = () =>
  apiClient.get<PnLSummary>('/trading/pnl');
