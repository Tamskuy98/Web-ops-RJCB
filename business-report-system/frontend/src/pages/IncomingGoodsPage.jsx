import { useState, useEffect } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate } from "../utils/helpers";
import { Plus, Trash2 } from "lucide-react";

export default function IncomingGoodsPage() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    supplier: "",
    date: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchItems = () => {
    setLoading(true);
    api
      .get("/incoming")
      .then((res) => setItems(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);
  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data.data))
      .catch(console.error);
  }, []);

  const openCreate = () => {
    setForm({
      productId: "",
      quantity: "",
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/incoming", {
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        supplier: form.supplier,
        date: form.date,
        note: form.note || undefined,
      });
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this incoming record?")) return;
    try {
      await api.delete(`/incoming/${id}`);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const paginated = items.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Incoming Goods</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus size={16} /> Add Incoming
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Product
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Qty
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Supplier
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Note
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {item.product?.name}
                    </td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-gray-600">{item.supplier}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {item.note || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-3">
            <Pagination
              totalItems={items.length}
              itemsPerPage={perPage}
              currentPage={page}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Incoming Goods"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <input
              type="text"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
