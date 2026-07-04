import { useState, useEffect } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency } from "../utils/helpers";
import { Plus, Pencil, Trash2, X, Eye } from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    date: "",
    items: [],
    tempItem: {
      productId: "",
      quantity: "",
      priceSell: "",
    },
    cash: "",
    qris: "",
  });

  const [saving, setSaving] = useState(false);

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
      cash: "",
      qris: "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.items.length === 0) {
      alert("Please add at least one product");
      return;
    }

    // Validation: Cash + QRIS must equal Total Penjualan
    const totalPenjualan = calculateGrandTotal();
    const cashAmount = parseFloat(form.cash) || 0;
    const qrisAmount = parseFloat(form.qris) || 0;
    const totalPayment = cashAmount + qrisAmount;

    if (Math.abs(totalPayment - totalPenjualan) > 0.01) {
      alert(
        `Payment mismatch: Cash + QRIS (${formatCurrency(totalPayment)}) must equal Total Penjualan (${formatCurrency(totalPenjualan)})`,
      );
      return;
    }

    if (!editId) {
      const dateAlreadyExists = sales.some(
        (sale) => new Date(sale.date).toISOString().split("T")[0] === form.date,
      );
      if (dateAlreadyExists) {
        alert(
          "A sales header record already exists for this date. Please choose another date.",
        );
        return;
      }
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
          cash: cashAmount,
          qris: qrisAmount,
        };
        await api.put(`/sales/${editId}`, payload);
      } else {
        // For create: submit a single payload with a list of items
        const payload = {
          Date: form.date,
          totalPayment: totalPenjualan,
          TotalQuantity: form.items.reduce(
            (sum, item) => sum + Number(item.quantity),
            0,
          ),
          cash: cashAmount,
          qris: qrisAmount,
          list: form.items.map((item) => ({
            productid: Number(item.productId),
            quantity: Number(item.quantity),
            priceSell: Number(item.priceSell),
          })),
        };
        await api.post("/sales", payload);
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

  const formatPaymentType = (type) => {
    if (!type) return "-";
    if (type === "Cash;Qris") return "Cash || Qris";
    return type;
  };

  const getPaymentBadgeClass = (paymentType) => {
    if (paymentType === "Cash") return "bg-emerald-100 text-emerald-800";
    if (paymentType === "Qris") return "bg-yellow-100 text-yellow-800";
    if (paymentType === "Cash || Qris") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-700";
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this sale record?")) return;
    try {
      await api.delete(`/sales/${id}`);
      fetchSales();
      if (
        selectedHeader &&
        selectedHeader.sales?.some((sale) => sale.id === id)
      ) {
        setSelectedHeader(null);
        setDetailModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting sale");
    }
  };

  const getFilteredSales = () => {
    if (!dateFilter) return sales;
    return sales.filter(
      (sale) => new Date(sale.date).toISOString().split("T")[0] === dateFilter,
    );
  };

  const openDetailView = (header) => {
    setSelectedHeader(header);
    setDetailModalOpen(true);
  };

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
          }}
          className="w-full sm:w-60 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        //TABEL RECORD
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
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Payment
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
                {getFilteredSales()
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((headersale) => (
                    <tr
                      key={headersale.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(headersale.date).toLocaleDateString("id-ID", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-gray-900">
                        {headersale.allquantity}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(headersale.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(formatPaymentType(headersale.typePayment))}`}
                        >
                          {formatPaymentType(headersale.typePayment)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        {formatCurrency(headersale.profit)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetailView(headersale)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {getFilteredSales().length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
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
                          {item.quantity} x {formatCurrency(item.priceSell)} ={" "}
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

          {/* PAYMENT INPUTS */}
          {form.items.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Payment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cash
                  </label>
                  <input
                    type="number"
                    value={form.cash}
                    onChange={(e) => setForm({ ...form, cash: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QRIS
                  </label>
                  <input
                    type="number"
                    value={form.qris}
                    onChange={(e) => setForm({ ...form, qris: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  />
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
        onClose={() => {
          setSelectedHeader(null);
          setDetailModalOpen(false);
        }}
        title={`Sales Detail - ${selectedHeader ? new Date(selectedHeader.date).toLocaleDateString("id-ID", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : ""}`}
      >
        {selectedHeader && (
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
                  {selectedHeader.sales.map((s) => (
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
                  {selectedHeader.allquantity}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Sales:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(selectedHeader.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Cash:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(selectedHeader.cash)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">QRIS:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(selectedHeader.qris)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-600">Total Profit Net:</span>
                <span className="text-lg text-green-600">
                  {formatCurrency(selectedHeader.profit)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => {
                  setSelectedHeader(null);
                  setDetailModalOpen(false);
                }}
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
