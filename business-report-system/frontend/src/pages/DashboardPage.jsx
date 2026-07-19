import { useState, useEffect } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency } from "../utils/helpers";
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

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cards from "../components/Cards";

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history");
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const historyCards = [
    {
      type: "sales",
      value: stats.cards?.totalSales,
    },
    {
      type: "revenue",
      value: formatCurrency(stats.cards?.totalRevenue),
    },
    {
      type: "opsCost",
      value: formatCurrency(stats.cards?.totalOpsCost),
    },
    {
      type: "supplyCost",
      value: formatCurrency(stats.cards?.totalSupplyCost),
    },
  ];

  const realtimeCards = [
    {
      type: "cashHand",
      value: formatCurrency(stats.cards?.realtimeCashHand),
    },
    {
      type: "cashHold",
      value: formatCurrency(stats.cards?.realtimeCashHold),
    },
    {
      type: "qris",
      value: formatCurrency(stats.cards?.realtimeQris),
    },
    {
      type: "outstandingpay",
      value: formatCurrency(stats.cards?.realtimeOutstandingPay),
    },
  ];

  const fetchStats = () => {
    setLoading(true);
    const params = {};
    if (activeTab === "history") {
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
    }

    api
      .get("/report/dashboard", { params })
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, [activeTab, filters.startDate, filters.endDate]);

  if (loading || !stats) return <LoadingSpinner size="lg" />;

  const formattedMonthlySales = (stats?.charts || []).map((item) => {
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

  // const formattedDailySales = (stats?.charts || []).map((item) => ({
  //   ...item,
  //   dateDisplay: new Date(item.date).toLocaleDateString("id-ID", {
  //     day: "numeric",
  //     month: "short",
  //   }),
  // }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h4 className="mb-1 text-base font-semibold text-red-700">
            Deskripsi:
          </h4>

          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">Laporan:</span>{" "}
              Menampilkan rekap keseluruhan transaksi berdasarkan periode yang
              dipilih.
            </p>

            <p>
              <span className="font-semibold text-gray-900">Saldo:</span>{" "}
              Menampilkan saldo terkini yang diperbarui secara otomatis setiap
              terjadi transaksi.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-full bg-white border border-gray-200 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              activeTab === "history"
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Laporan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("realtime")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              activeTab === "realtime"
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Saldo
          </button>
        </div>
      </div>

      {/* CARDS */}
      {activeTab === "history" ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 flex-1 items-center">
              {historyCards.map((card) => (
                <Cards
                  key={card.type}
                  variant="total"
                  type={card.type}
                  value={card.value}
                  className="h-36"
                />
              ))}
              <div className="w-full">
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => {
                    setDateRange(update);

                    const [start, end] = update;

                    if (start && end) {
                      setFilters((prev) => ({
                        ...prev,
                        startDate: start.toISOString().split("T")[0],
                        endDate: end.toISOString().split("T")[0],
                      }));
                    }
                  }}
                  isClearable
                  placeholderText="Pilih rentang tanggal"
                  dateFormat="dd MMMM yyyy"
                  wrapperClassName="w-full"
                  className="
      w-full
      h-14
      rounded-2xl
      border
      border-gray-200
      bg-white
      px-4
      text-center
      text-md
      font-medium
      text-gray-700
      shadow-sm
      transition-all
      duration-200
      outline-none
      hover:border-yellow-600
      focus:border-red-500
      focus:ring-4
      focus:ring-red-100
    "
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {realtimeCards.map((card, i) => (
            <Cards
              key={card.type}
              variant="saldo"
              type={card.type}
              value={card.value}
              className="h-36"
            />
          ))}
        </div>
      )}

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Total Penjualan per Bulan (Pcs)
          </h3>
          {formattedMonthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
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
                  dataKey="sales"
                  name="Total Penjualan (Pcs)"
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
            Total Pendapatan per Bulan (Rp)
          </h3>
          {formattedMonthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
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
                  dataKey="revenue"
                  name="Total Pendapatan (Rp)"
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

        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Profit per Month
          </h3>
          {formattedMonthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
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
        </div> */}
      </div>

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Sales per Day
          </h3>
          {formattedDailySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={formattedDailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dateDisplay" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  name="Daily Sales"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              Tidak ada data harian
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Warehouse Asset Volume
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">
              <p className="text-sm text-gray-600">Total Asset Value</p>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {formatCurrency(stats.history.totalAssetValue || 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">
              <p className="text-sm text-gray-600">Volume Barang Gudang</p>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {stats.history.warehouseVolume || 0}
              </p>
            </div>
          </div>
        </div>
      </div> */}

      {stats?.tables?.lowStockProducts?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="mb-4 text-lg font-semibold text-red-600">
            ⚠️ Stok Hampir Habis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Produk
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Stok tersedia
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Minimal stok
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.tables?.lowStockProducts.map((p) => (
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
