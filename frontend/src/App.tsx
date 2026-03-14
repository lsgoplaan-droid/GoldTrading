import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import TradeBlotter from './pages/trading/TradeBlotter';
import NewTrade from './pages/trading/NewTrade';
import Positions from './pages/trading/Positions';
import Counterparties from './pages/trading/Counterparties';
import Vaults from './pages/logistics/Vaults';
import Inventory from './pages/logistics/Inventory';
import Shipments from './pages/logistics/Shipments';
import Allocations from './pages/logistics/Allocations';
import RiskDashboard from './pages/risk/RiskDashboard';
import Limits from './pages/risk/Limits';
import StressTests from './pages/risk/StressTests';
import Alerts from './pages/risk/Alerts';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trading/blotter" element={<TradeBlotter />} />
            <Route path="/trading/new" element={<NewTrade />} />
            <Route path="/trading/positions" element={<Positions />} />
            <Route path="/trading/counterparties" element={<Counterparties />} />
            <Route path="/logistics/vaults" element={<Vaults />} />
            <Route path="/logistics/inventory" element={<Inventory />} />
            <Route path="/logistics/shipments" element={<Shipments />} />
            <Route path="/logistics/allocations" element={<Allocations />} />
            <Route path="/risk/dashboard" element={<RiskDashboard />} />
            <Route path="/risk/limits" element={<Limits />} />
            <Route path="/risk/stress-tests" element={<StressTests />} />
            <Route path="/risk/alerts" element={<Alerts />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
