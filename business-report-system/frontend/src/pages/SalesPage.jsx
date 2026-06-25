import { useState, useEffect } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency, formatDate } from "../utils/helpers";
import { Plus, Pencil, Trash2, X, Eye } from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailDate, setDetailDate] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    date: "",
    items: [],
    tempItem: {
      productId: "",
      quantity: "",
      priceSell: "",
    },
  });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchSales = () => {
    setLoading(true);
    api
      .get("/sales")
      .then((res) => setSales(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
  }, []);
  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data.data))
      .catch(console.error);
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({
      date: new Date().toISOString().split("T")[0],
      items: [],
      tempItem: {
        productId: "",
        quantity: "",
        priceSell: "",
      },
    });
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      date: new Date(s.date).toISOString().split("T")[0],
      items: [
        {
          productId: s.productId,
          quantity: s.quantity,
          priceSell: Number(s.priceSell),
        },
      ],
      tempItem: {
        productId: "",
        quantity: "",
        priceSell: "",
      },
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.items.length === 0) {
      alert("Please add at least one product");
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        // For edit: only update first item (backward compatibility)
        const item = form.items[0];
        const payload = {
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          priceSell: Number(item.priceSell),
          date: form.date,
        };
        await api.put(`/sales/${editId}`, payload);
      } else {
        // For create: submit each item as a separate sale
        for (const item of form.items) {
          const payload = {
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            priceSell: Number(item.priceSell),
            date: form.date,
          };
          await api.post("/sales", payload);
        }
      }
      setModalOpen(false);
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving sale");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProductToList = () => {
    const { productId, quantity, priceSell } = form.tempItem;

    if (!productId || !quantity || !priceSell) {
      alert("Please fill in all product fields");
      return;
    }

    const newItem = {
      productId: Number(productId),
      quantity: Number(quantity),
      priceSell: Number(priceSell),
    };

    setForm({
      ...form,
      items: [...form.items, newItem],
      tempItem: {
        productId: "",
        quantity: "",
        priceSell: "",
      },
    });
  };

  const handleRemoveItemFromList = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const handleProductChange = (productId) => {
    const product = products.find((p) => p.id === Number(productId));
    setForm({
      ...form,
      tempItem: {
        ...form.tempItem,
        productId,
        priceSell: product ? Number(product.priceSell) : "",
      },
    });
  };

  const calculateItemTotal = (quantity, price) => {
    return Number(quantity) * Number(price);
  };

  const calculateGrandTotal = () => {
    return form.items.reduce((total, item) => {
      return total + calculateItemTotal(item.quantity, item.priceSell);
    }, 0);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this sale record?")) return;
    try {
      await api.delete(`/sales/${id}`);
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting sale");
    }
  };

  // Group sales by date
  const groupSalesByDate = () => {
    const grouped = {};
    sales.forEach((sale) => {
      const dateKey = new Date(sale.date).toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(sale);
    });
    return grouped;
  };

  // Get summary for a specific date
  const getSaleSummaryForDate = (dateKey) => {
    const grouped = groupSalesByDate();
    const salesForDate = grouped[dateKey] || [];
    const totalQty = salesForDate.reduce((sum, s) => sum + s.quantity, 0);
    const totalProfit = salesForDate.reduce(
      (sum, s) => sum + Number(s.profit),
      0,
    );
    const totalSales = salesForDate.reduce(
      (sum, s) => sum + Number(s.total),
      0,
    );
    return { totalQty, totalProfit, totalSales, sales: salesForDate };
  };

  // Open detail view for a specific date
  const openDetailView = (dateKey) => {
    setDetailDate(dateKey);
    setDetailModalOpen(true);
  };

  // Filter grouped sales by date filter
  const getFilteredGroupedSales = () => {
    const grouped = groupSalesByDate();
    if (!dateFilter) return grouped;

    const filtered = {};
    if (grouped[dateFilter]) {
      filtered[dateFilter] = grouped[dateFilter];
    }
    return filtered;
  };

  const paginated = sales.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus size={16} /> Record Sale
        </button>
      </div>

      <div className="relative">
        <input
          type="date"
          placeholder="Filter by date..."
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-60 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
        />
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
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Total Qty
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">
                    Total Sales
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">
                    Profit
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(getFilteredGroupedSales())
                  .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                  .map(([dateKey, salesForDay]) => {
                    const summary = getSaleSummaryForDate(dateKey);
                    return (
                      <tr
                        key={dateKey}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(dateKey).toLocaleDateString("id-ID", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-gray-900">
                          {summary.totalQty}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {formatCurrency(summary.totalSales)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">
                          {formatCurrency(summary.totalProfit)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openDetailView(dateKey)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                              title="View details"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {Object.keys(getFilteredGroupedSales()).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No sales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit Sale" : "Record Sale"}
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-96 overflow-y-auto"
        >
          {/* DATE */}
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

          {/* PRODUCT FORM INPUT */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Add Products
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                value={form.tempItem.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.tempItem.quantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tempItem: {
                        ...form.tempItem,
                        quantity: e.target.value,
                      },
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={form.tempItem.priceSell}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tempItem: {
                        ...form.tempItem,
                        priceSell: e.target.value,
                      },
                    })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  &nbsp;
                </label>
                <button
                  type="button"
                  onClick={handleAddProductToList}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  <Plus size={16} className="inline" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* PRODUCTS LIST */}
          {form.items.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Products Added
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {form.items.map((item, idx) => {
                  const product = products.find((p) => p.id === item.productId);
                  const itemTotal = calculateItemTotal(
                    item.quantity,
                    item.priceSell,
                  );
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-gray-900">
                          {product?.name}
                        </p>
                        <p className="text-gray-600">
                          {item.quantity} Ã— {formatCurrency(item.priceSell)} ={" "}
                          {formatCurrency(itemTotal)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemFromList(idx)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* TOTAL PENJUALAN */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">
                    Total Penjualan:
                  </span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(calculateGrandTotal())}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SUBMIT BUTTONS */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || form.items.length === 0}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL - Show all sales for a specific date */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Sales Detail - ${detailDate ? new Date(detailDate).toLocaleDateString("id-ID", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : ""}`}
      >
        {detailDate && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">
                      Product
                    </th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">
                      Qty
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">
                      Price
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">
                      Total
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">
                      Profit
                    </th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSaleSummaryForDate(detailDate).sales.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {s.product?.name}
                      </td>
                      <td className="py-2 px-3 text-center">{s.quantity}</td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatCurrency(s.priceSell)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatCurrency(s.total)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-green-600">
                        {formatCurrency(s.profit)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setDetailModalOpen(false);
                              openEdit(s);
                            }}
                            className="p-1 hover:bg-red-50 text-red-600 rounded-lg"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this sale record?")) {
                                handleDelete(s.id);
                                setDetailModalOpen(false);
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-red-600 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Quantity:</span>
                <span className="font-semibold text-gray-900">
                  {getSaleSummaryForDate(detailDate).totalQty}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Sales:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(getSaleSummaryForDate(detailDate).totalSales)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-600">Total Profit:</span>
                <span className="text-lg text-green-600">
                  {formatCurrency(
                    getSaleSummaryForDate(detailDate).totalProfit,
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
