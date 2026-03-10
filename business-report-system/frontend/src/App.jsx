import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import IncomingGoodsPage from './pages/IncomingGoodsPage';
import RestockPage from './pages/RestockPage';
import WarehouseStockPage from './pages/WarehouseStockPage';
import ReportsPage from './pages/ReportsPage';
import ProfitSharePage from './pages/ProfitSharePage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="incoming" element={<IncomingGoodsPage />} />
        <Route path="restock" element={<RestockPage />} />
        <Route path="warehouse" element={<WarehouseStockPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profit-share" element={<ProfitSharePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
