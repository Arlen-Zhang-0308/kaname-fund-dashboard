import { DashboardClient } from '@/components/DashboardClient';
import { getPortfolioState } from '@/lib/portfolio';

export default function Home() {
  const state = getPortfolioState();
  return <DashboardClient state={state} />;
}
