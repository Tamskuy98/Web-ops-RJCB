import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus } from 'lucide-react';

export default function RestockPage() {
  const [restocks, setRestocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '', purchasePrice: '', supplier: '', date: '' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchRestocks = () => {
    setLoading(true);
    api.get('/restock')
      .then((res) => setRestocks(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRestocks(); }, []);
  useEffect(() => { api.get('/products').then((res) => setProducts(res.data.data)).catch(console.error); }, []);

  const openCreate = () => {
    setForm({ productId: '', quantity: '', purchasePrice: '', supplier: '', date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const handleProductChange = (productId) => {
    const product = products.find((p) => p.id === Number(productId));
    setForm({ ...form, productId, purchasePrice: product ? Number(product.priceCost) : '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/restock', {
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        purchasePrice: Number(form.purchasePrice),
        supplier: form.supplier,
        date: form.date,
      });
      setModalOpen(false);
      fetchRestocks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const paginated = restocks.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Restock</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Add Restock
        </button>
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
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Purchase Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{formatDate(r.date)}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{r.product?.name}</td>
                    <td className="py-3 px-4 text-center">{r.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(r.purchasePrice)}</td>
                    <td className="py-3 px-4 text-gray-600">{r.supplier}</td>
                  </tr>
                ))}
                {paginated.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No records found</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-3">
            <Pagination totalItems={restocks.length} itemsPerPage={perPage} currentPage={page} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Restock">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select value={form.productId} onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
              <input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
            </div>
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
