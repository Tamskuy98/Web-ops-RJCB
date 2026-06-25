import { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    productId: '',
  });

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data.data)).catch(console.error);
  }, []);

  const fetchReport = () => {
    setLoading(true);
    const params = { ...filters };
    if (!params.productId) delete params.productId;
    api.get('/report/sales', { params })
      .then((res) => setReport(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(); }, []);

  const exportCSV = () => {
    if (!report?.sales?.length) return;
    const headers = ['Date,Product,Quantity,Price,Total,Profit'];
    const rows = report.sales.map((s) =>
      `${formatDate(s.date)},${s.product?.name},${s.quantity},${Number(s.priceSell)},${Number(s.total)},${Number(s.profit)}`
    );
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${filters.startDate}-${filters.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadServerExport = async (type) => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      const format = type === 'excel' ? 'excel' : 'pdf';
      const res = await api.get(`/export/sales/${format}?${params.toString()}`, { responseType: 'blob' });
      const ext = type === 'excel' ? 'xlsx' : 'pdf';
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${filters.startDate}-${filters.endDate}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select value={filters.productId} onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm">
              <option value="">All Products</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={fetchReport} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
            Generate
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download size={15} /> CSV
          </button>
          <button onClick={() => downloadServerExport('excel')} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button onClick={() => downloadServerExport('pdf')} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(report.summary.totalSales)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-sm text-gray-500">Total Profit</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(report.summary.totalProfit)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{report.summary.totalTransactions}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Qty</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.map((s, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600">{formatDate(s.date)}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{s.product?.name}</td>
                      <td className="py-3 px-4 text-center">{s.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(s.total)}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(s.profit)}</td>
                    </tr>
                  ))}
                  {report.sales.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No data found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
