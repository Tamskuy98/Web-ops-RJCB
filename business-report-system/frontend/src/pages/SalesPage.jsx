import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ productId: '', quantity: '', priceSell: '', date: '' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchSales = () => {
    setLoading(true);
    api.get('/sales', { params: { search } })
      .then((res) => setSales(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSales(); }, [search]);
  useEffect(() => { api.get('/products').then((res) => setProducts(res.data.data)).catch(console.error); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ productId: '', quantity: '', priceSell: '', date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      productId: s.productId,
      quantity: s.quantity,
      priceSell: Number(s.priceSell),
      date: new Date(s.date).toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        priceSell: Number(form.priceSell),
        date: form.date,
      };
      if (editId) await api.put(`/sales/${editId}`, payload);
      else await api.post('/sales', payload);
      setModalOpen(false);
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving sale');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sale record?')) return;
    try {
      await api.delete(`/sales/${id}`);
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting sale');
    }
  };

  const handleProductChange = (productId) => {
    const product = products.find((p) => p.id === Number(productId));
    setForm({ ...form, productId, priceSell: product ? Number(product.priceSell) : '' });
  };

  const paginated = sales.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Record Sale
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search by product name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Qty</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Price</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Profit</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{formatDate(s.date)}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{s.product?.name}</td>
                    <td className="py-3 px-4 text-center">{s.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(s.priceSell)}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(s.total)}</td>
                    <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(s.profit)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No sales found</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-3">
            <Pagination totalItems={sales.length} itemsPerPage={perPage} currentPage={page} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Sale' : 'Record Sale'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select value={form.productId} onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Sell</label>
              <input type="number" value={form.priceSell} onChange={(e) => setForm({ ...form, priceSell: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
