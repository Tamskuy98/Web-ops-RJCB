import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { getStockStatus } from '../utils/helpers';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function WarehouseStockPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    api.get('/products')
      .then((res) => setProducts(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const safe = products.filter((p) => p.stock > p.minStock).length;
  const low = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const empty = products.filter((p) => p.stock === 0).length;

  const chartData = [
    { name: 'Safe', value: safe },
    { name: 'Low Stock', value: low },
    { name: 'Out of Stock', value: empty },
  ].filter((d) => d.value > 0);

  const paginated = products.slice((page - 1) * perPage, page * perPage);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Warehouse Stock</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Current Stock</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Min Stock</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => {
                  const status = getStockStatus(p.stock, p.minStock);
                  return (
                    <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                      <td className="py-3 px-4 text-gray-600">{p.category}</td>
                      <td className="py-3 px-4 text-center font-semibold">{p.stock}</td>
                      <td className="py-3 px-4 text-center text-gray-500">{p.minStock}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-3">
            <Pagination totalItems={products.length} itemsPerPage={perPage} currentPage={page} onPageChange={setPage} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Stock Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Safe</span><span className="font-semibold text-green-600">{safe}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Low Stock</span><span className="font-semibold text-yellow-600">{low}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Out of Stock</span><span className="font-semibold text-red-600">{empty}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
