import { useState, useEffect } from "react";
import api from "../services/api";
import TransactionRecord from "../components/TransactionRecord";
import TransactionRecordDetail from "../components/TransactionRecordDetail";
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
import { Download, Loader2 } from "lucide-react";

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
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionLogs, setTransactionLogs] = useState([]);

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

  const fetchTransactionLogs = () => {
    const params = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    api
      .get("/transaction-logs", { params })
      .then((res) => setTransactionLogs(res.data.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchStats();
    fetchTransactionLogs();
  }, [activeTab, filters.startDate, filters.endDate]);

  const openTransactionDetail = async (transaction) => {
    try {
      const response = await api.get(`/transaction-logs/${transaction.id}`);
      setSelectedTransaction(response.data.data);
    } catch (error) {
      console.error(error);
      setSelectedTransaction(transaction);
    }
  };

  // Reads the JSON error message out of an error blob response (axios responseType: 'blob')
  const parseBlobError = async (err) => {
    const fallback = "Gagal membuat laporan. Silakan coba lagi.";
    const data = err?.response?.data;
    if (!(data instanceof Blob))
      return err?.response?.data?.message || fallback;
    try {
      const text = await data.text();
      return JSON.parse(text)?.message || fallback;
    } catch {
      return fallback;
    }
  };

  const handleDownloadReport = async () => {
    if (downloadingReport) return; // prevent multiple clicks while a download is in flight
    setDownloadingReport(true);
    setDownloadError("");
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get("/export/financial/pdf", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const suffix =
        filters.startDate && filters.endDate
          ? `${filters.startDate}_${filters.endDate}`
          : "semua-periode";
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-keuangan-${suffix}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(await parseBlobError(err));
    } finally {
      setDownloadingReport(false);
    }
  };

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

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex items-center gap-3">
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

            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={downloadingReport}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadingReport ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {downloadingReport ? "Membuat laporan..." : "Download Report"}
            </button>
          </div>

          {downloadError && (
            <p className="text-xs text-red-600 sm:text-right">
              {downloadError}
            </p>
          )}
        </div>
      </div>

      {/* LAPORAN ALL */}
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

      {/* LAPORAN SALDO */}
      {activeTab === "history" ? (
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
      ) : (
        <>
          <div className="mb-3">
            <h3 className="ml-3 text-sm font-semibold text-gray-600">
              Log Transaksi
            </h3>
            <div className="mt-1 ml-2 h-[1px] w-30 border-b border-gray-600" />
          </div>

          <div className="space-y-2">
            {transactionLogs?.map((transaction) => (
              <TransactionRecord
                key={transaction.id}
                transaction={transaction}
                onClick={openTransactionDetail}
              />
            ))}

            {transactionLogs.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                Belum ada log transaksi pada periode ini.
              </div>
            )}
          </div>

          <TransactionRecordDetail
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        </>
      )}

      {/* CHARTS */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      {/* </div> */}

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
