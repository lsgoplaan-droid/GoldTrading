import apiClient from './client';
import { Vault, GoldItem, Shipment, Allocation } from '../types';

export const getVaults = () =>
  apiClient.get<Vault[]>('/logistics/vaults');

export const createVault = (data: {
  name: string;
  code: string;
  location: string;
  operator?: string;
  capacity_oz?: number;
}) => apiClient.post<Vault>('/logistics/vaults', data);

export const getInventory = (vaultId?: number, status?: string) =>
  apiClient.get<GoldItem[]>('/logistics/inventory', {
    params: { vault_id: vaultId, status },
  });

export const createGoldItem = (data: {
  serial_number: string;
  item_type: string;
  weight_oz: number;
  gross_weight_oz: number;
  purity: number;
  refiner?: string;
  assay_certificate?: string;
  vault_id: number;
  owner?: string;
}) => apiClient.post<GoldItem>('/logistics/inventory', data);

export const getShipments = (status?: string) =>
  apiClient.get<Shipment[]>('/logistics/shipments', { params: { status } });

export const createShipment = (data: {
  origin_vault_id: number;
  destination_vault_id: number;
  carrier?: string;
  departure_date?: string;
  estimated_arrival?: string;
  insurance_value?: number;
  gold_item_ids: number[];
}) => apiClient.post<Shipment>('/logistics/shipments', data);

export const updateShipmentStatus = (id: number, status: string, actual_arrival?: string) =>
  apiClient.patch<Shipment>(`/logistics/shipments/${id}/status`, { status, actual_arrival });

export const getAllocations = () =>
  apiClient.get<Allocation[]>('/logistics/allocations');

export const createAllocation = (data: {
  gold_item_id: number;
  counterparty_id: number;
  allocation_type: string;
  allocated_date: string;
}) => apiClient.post<Allocation>('/logistics/allocations', data);

export const releaseAllocation = (id: number) =>
  apiClient.delete(`/logistics/allocations/${id}`);
