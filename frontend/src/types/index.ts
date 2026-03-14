export interface GoldPrice {
  price: number;
  prev_close: number | null;
  change: number | null;
  change_pct: number | null;
  timestamp: string;
  source: string;
}

export interface PriceHistoryPoint {
  price: number;
  timestamp: string;
}

export interface DashboardSummary {
  net_position_oz: number;
  unrealized_pnl: number;
  realized_pnl: number;
  var_95: number;
  total_inventory_oz: number;
  active_alerts: number;
  total_trades: number;
  current_gold_price: number;
}

export interface Counterparty {
  id: number;
  name: string;
  code: string;
  type: string;
  credit_rating: string | null;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface Trade {
  id: number;
  trade_ref: string;
  trade_type: string;
  product_type: string;
  counterparty_id: number;
  quantity_oz: number;
  price_per_oz: number;
  total_value: number;
  currency: string;
  trade_date: string;
  settlement_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  counterparty: Counterparty | null;
}

export interface Position {
  id: number;
  account: string;
  net_quantity_oz: number;
  avg_cost_per_oz: number;
  realized_pnl: number;
  unrealized_pnl: number;
  current_price: number;
  total_value: number;
  updated_at: string | null;
}

export interface PnLSummary {
  total_realized_pnl: number;
  total_unrealized_pnl: number;
  total_pnl: number;
  current_price: number;
}

export interface Vault {
  id: number;
  name: string;
  code: string;
  location: string;
  operator: string | null;
  capacity_oz: number;
  is_active: boolean;
  created_at: string;
  current_holdings_oz: number;
  item_count: number;
}

export interface GoldItem {
  id: number;
  serial_number: string;
  item_type: string;
  weight_oz: number;
  gross_weight_oz: number;
  purity: number;
  fine_weight_oz: number;
  refiner: string | null;
  assay_certificate: string | null;
  vault_id: number;
  status: string;
  owner: string | null;
  created_at: string;
  vault_name: string | null;
}

export interface Shipment {
  id: number;
  shipment_ref: string;
  origin_vault_id: number;
  destination_vault_id: number;
  carrier: string | null;
  status: string;
  departure_date: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  insurance_value: number;
  notes: string | null;
  created_at: string;
  origin_vault_name: string | null;
  destination_vault_name: string | null;
  item_count: number;
  total_weight_oz: number;
}

export interface Allocation {
  id: number;
  gold_item_id: number;
  counterparty_id: number;
  allocation_type: string;
  allocated_date: string;
  is_active: boolean;
  released_date: string | null;
  created_at: string;
  gold_item_serial: string | null;
  counterparty_name: string | null;
}

export interface RiskLimit {
  id: number;
  limit_type: string;
  limit_name: string;
  max_value: number;
  current_value: number;
  currency: string;
  is_active: boolean;
  breached: boolean;
  utilization_pct: number;
  updated_at: string | null;
}

export interface VaRResponse {
  var_95: number;
  var_99: number;
  confidence_level: number;
  horizon_days: number;
  position_value: number;
  calculation_date: string;
}

export interface ExposureResponse {
  gross_long: number;
  gross_short: number;
  net_exposure: number;
  net_exposure_oz: number;
  current_price: number;
}

export interface MarginAccount {
  id: number;
  counterparty_id: number;
  counterparty_name: string | null;
  required_margin: number;
  posted_margin: number;
  margin_call_amount: number;
  last_call_date: string | null;
}

export interface RiskAlert {
  id: number;
  alert_type: string;
  severity: string;
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}

export interface StressScenario {
  id: number;
  name: string;
  price_shock_pct: number;
  description: string | null;
  result_pnl: number | null;
  last_run_at: string | null;
}

export interface StressTestResult {
  scenario_name: string;
  price_shock_pct: number;
  current_price: number;
  shocked_price: number;
  pnl_impact: number;
  positions_affected: number;
}

export interface MtMResponse {
  positions: Array<{
    account: string;
    quantity_oz: number;
    avg_cost: number;
    market_value: number;
    cost_basis: number;
    unrealized_pnl: number;
  }>;
  total_market_value: number;
  total_cost_basis: number;
  total_unrealized_pnl: number;
  current_price: number;
  timestamp: string;
}
