import examplePortfolioState from '@/data/portfolio-state.example.json';

export type Holding = {
  code: string;
  name: string;
  asset_type: string;
  portfolio_layer: 'main_plan' | 'independent_tracking' | string;
  industry: string;
  units: number;
  unit_label: string;
  cost_unit_price: number;
  cost_amount: number;
  current_unit_price: number | null;
  current_amount: number | null;
  unrealized_pnl: number | null;
  unrealized_pnl_rate: number | null;
  current_amount_weight: number | null;
  price_source: string;
  price_updated_at: string;
  note?: string;
};

export type SoldPosition = {
  code: string;
  name: string;
  asset_type: string;
  portfolio_layer: 'sold_record' | string;
  industry: string;
  sold_units: number;
  unit_label: string;
  cost_amount: number;
  proceeds_amount: number;
  sell_unit_price: number;
  realized_pnl: number;
  realized_pnl_rate: number;
  sell_date: string;
  price_source: string;
  price_updated_at: string;
  note?: string;
};

export type PortfolioState = {
  schema_version: string;
  updated_at: string;
  currency: string;
  current_total_cost: number;
  current_total_amount: number;
  holding_total_pnl: number;
  sold_realized_pnl: number;
  calculation_notes: Record<string, string>;
  holdings: Holding[];
  sold_positions: SoldPosition[];
};

function parsePortfolioFromEnv(): PortfolioState | null {
  const raw = process.env.PORTFOLIO_STATE_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortfolioState;
  } catch (error) {
    console.error('Invalid PORTFOLIO_STATE_JSON. Falling back to example data.', error);
    return null;
  }
}

export function getPortfolioState(): PortfolioState {
  return parsePortfolioFromEnv() ?? (examplePortfolioState as PortfolioState);
}

export function getPortfolioSummary() {
  const state = getPortfolioState();
  const mainHoldings = state.holdings.filter((item) => item.portfolio_layer === 'main_plan');
  const independentHoldings = state.holdings.filter((item) => item.portfolio_layer === 'independent_tracking');
  const sumCurrent = (items: Holding[]) => items.reduce((sum, item) => sum + (item.current_amount ?? 0), 0);

  return {
    updated_at: state.updated_at,
    currency: state.currency,
    current_total_amount: state.current_total_amount,
    current_total_cost: state.current_total_cost,
    holding_total_pnl: state.holding_total_pnl,
    sold_realized_pnl: state.sold_realized_pnl,
    main_plan_amount: sumCurrent(mainHoldings),
    independent_tracking_amount: sumCurrent(independentHoldings),
    holding_codes: state.holdings.map((item) => item.code),
    sold_codes: state.sold_positions.map((item) => item.code),
    data_source: process.env.PORTFOLIO_STATE_JSON ? 'vercel_env' : 'public_example'
  };
}
