import { useState, useEffect } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency } from "../utils/helpers";
import { ShoppingCart, TrendingUp, Package, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/report/dashboard")
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  // Format monthly sales data for better display
  const formattedMonthlySales = (stats?.monthlySales || []).map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(year, parseInt(month) - 1);
    const monthName = date.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
    return {
      ...item,
      monthDisplay: monthName,
    };
  });

  const cards = [
    {
      title: "Total Penjualan Hari Ini",
      value: formatCurrency(stats?.todaySales || 0),
      icon: ShoppingCart,
      color: "bg-red-500",
    },
    {
      title: "Total Profit Periode",
      value: formatCurrency(stats?.periodProfit || 0),
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Total Produk",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "bg-purple-500",
    },
    {
      title: "Barang Hampir Habis",
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon size={22} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Sales per Month
          </h3>
          {formattedMonthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedMonthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="monthDisplay" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar
                  dataKey="totalSales"
                  name="Sales"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              Tidak ada data penjualan
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Profit per Month
          </h3>
          {formattedMonthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedMonthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="monthDisplay" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalProfit"
                  name="Profit"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              Tidak ada data profit
            </div>
          )}
        </div>
      </div>

      {stats?.lowStockProducts?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Low Stock Alert
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Product
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Current Stock
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Min Stock
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockProducts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-2 px-3">{p.name}</td>
                    <td className="py-2 px-3">{p.stock}</td>
                    <td className="py-2 px-3">{p.minStock}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.stock === 0 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {p.stock === 0 ? "Out of Stock" : "Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

