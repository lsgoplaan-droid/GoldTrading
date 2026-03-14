import apiClient from './client';
import {
  VaRResponse, ExposureResponse, MtMResponse,
  RiskLimit, MarginAccount, RiskAlert,
  StressScenario, StressTestResult,
} from '../types';
import { DashboardSummary } from '../types';

export const getDashboardSummary = () =>
  apiClient.get<DashboardSummary>('/dashboard/summary');

export const getVaR = (confidence = 0.95, horizon = 1) =>
  apiClient.get<VaRResponse>('/risk/var', { params: { confidence, horizon } });

export const getExposure = () =>
  apiClient.get<ExposureResponse>('/risk/exposure');

export const getMtM = () =>
  apiClient.get<MtMResponse>('/risk/mtm');

export const getRiskLimits = () =>
  apiClient.get<RiskLimit[]>('/risk/limits');

export const createRiskLimit = (data: {
  limit_type: string;
  limit_name: string;
  max_value: number;
  currency?: string;
}) => apiClient.post<RiskLimit>('/risk/limits', data);

export const getMarginAccounts = () =>
  apiClient.get<MarginAccount[]>('/risk/margin');

export const recalculateMargins = () =>
  apiClient.post('/risk/margin/recalculate');

export const getAlerts = (severity?: string, acknowledged?: boolean) =>
  apiClient.get<RiskAlert[]>('/risk/alerts', {
    params: { severity, acknowledged },
  });

export const acknowledgeAlert = (id: number) =>
  apiClient.patch(`/risk/alerts/${id}/acknowledge`);

export const getStressScenarios = () =>
  apiClient.get<StressScenario[]>('/risk/stress-tests');

export const createStressScenario = (data: {
  name: string;
  price_shock_pct: number;
  description?: string;
}) => apiClient.post<StressScenario>('/risk/stress-tests', data);

export const runStressTest = (id: number) =>
  apiClient.post<StressTestResult>(`/risk/stress-tests/${id}/run`);
