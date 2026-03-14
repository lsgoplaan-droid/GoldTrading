import apiClient from './client';
import { GoldPrice, PriceHistoryPoint } from '../types';

export const getCurrentPrice = () =>
  apiClient.get<GoldPrice>('/prices/current');

export const getPriceHistory = (days = 30) =>
  apiClient.get<PriceHistoryPoint[]>(`/prices/history?days=${days}`);
