import { useState, useEffect } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate, formatCurrency } from "../utils/helpers";
import { Plus, Trash2, X } from "lucide-react";

const defaultFormState = {
  date: "",
  supplier: "",
  items: [],
  newItem: {
    name: "gas",
    qty: "",
    price: "",
  },
  otherItemName: "",
  attachmentType: "foto",
  attachmentFile: null,
  attachmentUrl: "",
  paymentCashOnHand: "",
  paymentCashHold: "",
  paymentQris: "",
  note: "",
};

const paymentColor = {
  "CASH ON HAND": "bg-green-100 text-green-700",
  "CASH HOLD": "bg-blue-100 text-blue-700",
  QRIS: "bg-yellow-100 text-yellow-700",
};

// ========================================
// HELPER FUNCTIONS
// ========================================

const calculateTotalPayment = (items) => {
  return items.reduce(
    (sum, item) => sum + Number(item.qty) * Number(item.price),
    0,
  );
};

const calculateTotalPaid = (cashOnHand, cashHold, qris) => {
  return Number(cashOnHand || 0) + Number(cashHold || 0) + Number(qris || 0);
};

const calculateTypePayment = (cashOnHand, cashHold, qris) => {
  const types = [];
  if (Number(qris || 0) > 0) types.push("QRIS");
  if (Number(cashOnHand || 0) > 0) types.push("CASH ON HAND");
  if (Number(cashHold || 0) > 0) types.push("CASH HOLD");
  return types.length > 0 ? types.join(";") : "none";
};

const calculateStatus = (totalPayment, totalPaid) => {
  return totalPaid >= totalPayment ? "LUNAS" : "HUTANG";
};

const calculateOutstandingPay = (totalPayment, totalPaid) => {
  return Math.max(0, totalPayment - totalPaid);
};

const calculateAllQty = (items) => {
  return items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
};

const calculateItemTotal = (item) => {
  return Number(item.qty || 0) * Number(item.price || 0);
};

const formatTypePayment = (cashOnHand, cashHold, qris) => {
  const types = [];
  if (Number(cashOnHand) > 0) types.push("CASH ON HAND");
  if (Number(cashHold) > 0) types.push("CASH HOLD");
  if (Number(qris) > 0) types.push("QRIS");
  return types.length > 0 ? types.join(";") : "-";
};

// ========================================
// VALIDATION FUNCTIONS
// ========================================

const validateForm = (form, totalPayment, totalPaid) => {
  const errors = [];

  if (!form.date) {
    errors.push("Tanggal harus diisi");
  }

  if (!form.supplier?.trim()) {
    errors.push("Supplier harus diisi");
  }

  if (!form.items || form.items.length === 0) {
    errors.push("Minimal tambah 1 item");
  }

  if (!form.attachmentType) {
    errors.push("Tipe lampiran harus dipilih");
  } else {
    if (form.attachmentType === "foto" && !form.attachmentFile) {
      errors.push("File foto harus diupload");
    }
    if (form.attachmentType === "file" && !form.attachmentUrl?.trim()) {
      errors.push("URL lampiran harus diisi");
    }
  }

  if (totalPaid > totalPayment) {
    errors.push("Total Dibayar tidak boleh lebih besar dari Total Belanja");
  }

  return errors;
};

// ========================================
// MAIN COMPONENT
// ========================================

export default function OperationalPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState([]);
  const perPage = 10;

  // ---- FETCH DATA ----
  const fetchItems = () => {
    setLoading(true);
    api
      .get("/operational")
      .then((res) => setItems(res.data.data))
      .catch((err) => {
        console.error("Fetch error:", err);
        alert("Gagal mengambil data");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ---- MODAL HANDLERS ----
  const openCreate = () => {
    setForm({
      ...defaultFormState,
      date: new Date().toISOString().split("T")[0],
    });
    setValidationErrors([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setValidationErrors([]);
    setForm(defaultFormState);
  };

  // ---- CALCULATIONS ----
  const totalPayment = calculateTotalPayment(form.items);
  const cashOnHand = Number(form.paymentCashOnHand || 0);
  const cashHold = Number(form.paymentCashHold || 0);
  const qris = Number(form.paymentQris || 0);
  const totalPaid = calculateTotalPaid(cashOnHand, cashHold, qris);
  const typePayment = calculateTypePayment(cashOnHand, cashHold, qris);
  const typePaymentFormatted = formatTypePayment(cashOnHand, cashHold, qris);
  const status = calculateStatus(totalPayment, totalPaid);
  const outstandingPay = calculateOutstandingPay(totalPayment, totalPaid);
  const allQty = calculateAllQty(form.items);

  // ---- ITEM MANAGEMENT ----
  const handleNewItemChange = (field, value) => {
    setForm({
      ...form,
      newItem: {
        ...form.newItem,
        [field]: value,
      },
    });
  };

  const addItem = () => {
    const { name, qty, price } = form.newItem;

    const itemErrors = [];
    if (!qty || Number(qty) <= 0) {
      itemErrors.push("Jumlah barang harus lebih dari 0");
    }
    if (!price || Number(price) <= 0) {
      itemErrors.push("Harga barang harus lebih dari 0");
    }
    if (name === "lainnya" && !form.otherItemName?.trim()) {
      itemErrors.push("Kategori lainnya harus diisi");
    }

    if (itemErrors.length > 0) {
      setValidationErrors(itemErrors);
      return;
    }

    const itemName =
      name === "lainnya"
        ? form.otherItemName.trim()
        : name.charAt(0).toUpperCase() + name.slice(1);

    setValidationErrors([]);
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          name: itemName,
          qty: Number(qty),
          price: Number(price),
        },
      ],
      newItem: {
        name: "gas",
        qty: "",
        price: "",
      },
      otherItemName: "",
    });
  };

  const removeItem = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  // ---- ATTACHMENT HANDLER ----
  const handleAttachmentChange = (e) => {
    if (form.attachmentType === "foto") {
      setForm({
        ...form,
        attachmentFile: e.target.files?.[0] || null,
      });
    } else {
      setForm({
        ...form,
        attachmentUrl: e.target.value,
      });
    }
  };

  // ---- SUBMIT HANDLER ----
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm(form, totalPayment, totalPaid);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    setValidationErrors([]);

    try {
      const payload = new FormData();

      // Basic info
      payload.append("date", new Date(form.date).toISOString());
      payload.append("supplier", form.supplier.trim());
      payload.append("note", form.note?.trim() || "");
      payload.append("category", "Operational");

      // Attachment
      payload.append("attachmentType", form.attachmentType);
      if (form.attachmentType === "foto" && form.attachmentFile) {
        payload.append("attachment", form.attachmentFile);
      } else if (form.attachmentType === "file") {
        payload.append("attachment", form.attachmentUrl.trim());
      }

      // Payment info
      payload.append("cashOnHand", cashOnHand);
      payload.append("cashHold", cashHold);
      payload.append("qris", qris);
      payload.append("totalPayment", totalPayment);
      payload.append("typePayment", typePayment === "none" ? "" : typePayment);
      payload.append("status", status);
      payload.append("outstandingPay", outstandingPay);
      payload.append("allQty", allQty);

      // Items
      form.items.forEach((item, idx) => {
        payload.append(`items[${idx}][name]`, item.name);
        payload.append(`items[${idx}][qty]`, item.qty);
        payload.append(`items[${idx}][price]`, item.price);
      });

      await api.post("/operational", payload, {
        // headers: {
        //   "Content-Type": "multipart/form-data",
        // },
      });

      closeModal();
      fetchItems();
      alert("Data operational berhasil disimpan");
    } catch (err) {
      console.error("Submit error:", err);
      const errorMessage =
        err.response?.data?.message || "Gagal menyimpan data";
      setValidationErrors([errorMessage]);
    } finally {
      setSaving(false);
    }
  };

  // ---- DELETE HANDLER ----
  const handleDelete = async (id) => {
    if (!confirm("Hapus data operational ini?")) return;

    try {
      await api.delete(`/operational/${id}`);
      fetchItems();
      alert("Data berhasil dihapus");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Gagal menghapus data");
    }
  };

  const paginated = items.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Belanja Operasional
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Tanggal
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Supplier
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Total Belanja
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Tipe Bayar
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Sisa Hutang
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-300 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{item.supplier}</td>
                    <td className="py-3 px-4 text-left font-medium text-gray-900">
                      {formatCurrency(item.totalPayment || 0)}
                    </td>
                    <td className="py-3 px-4 text-left font-small">
                      {item.typePayment ? (
                        <div className="flex flex-wrap gap-2">
                          {item.typePayment.split(";").map((payment, index) => (
                            <span
                              key={index}
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                paymentColor[payment] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {payment}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.status === "LUNAS"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-left text-red-900">
                      {formatCurrency(item.outstandingPay || 0)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      Tidak ada data
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

      {/* MODAL */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Tambah Operasional">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* VALIDATION ERRORS */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm font-medium text-red-800 mb-2">
                Validasi Error:
              </div>
              <ul className="space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="text-sm text-red-700">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* BASIC INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Nama supplier"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                required
              />
            </div>
          </div>

          {/* ITEMS SECTION */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Tambah Item</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Barang
                </label>
                <select
                  value={form.newItem.name}
                  onChange={(e) => handleNewItemChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                >
                  <option value="gas">Gas</option>
                  <option value="minyak">Minyak</option>
                  <option value="token_listrik">Token Listrik</option>
                  <option value="plastik_bungkus">Plastik Bungkus</option>
                  <option value="kertas_bungkus">Kertas Bungkus</option>
                  <option value="saus">Saus</option>
                  <option value="lainnya">Lainnya</option>
                </select>

                {form.newItem.name === "lainnya" && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori Lainnya
                    </label>
                    <input
                      type="text"
                      value={form.otherItemName}
                      onChange={(e) =>
                        setForm({ ...form, otherItemName: e.target.value })
                      }
                      placeholder="Sebutkan kategori lainnya"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.newItem.qty}
                    onChange={(e) => handleNewItemChange("qty", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.newItem.price}
                    onChange={(e) =>
                      handleNewItemChange("price", e.target.value)
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end md:col-span-2">
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus size={14} /> Tambah Item
                </button>
              </div>
            </div>

            {/* ITEMS LIST */}
            {form.items.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  Daftar Belanja ({form.items.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white">
                      <tr>
                        <th className="text-left py-2 px-3 text-gray-600">
                          Barang
                        </th>
                        <th className="text-right py-2 px-3 text-gray-600">
                          Jumlah
                        </th>
                        <th className="text-right py-2 px-3 text-gray-600">
                          Harga
                        </th>
                        <th className="text-right py-2 px-3 text-gray-600">
                          Total
                        </th>
                        <th className="text-center py-2 px-3 text-gray-600">
                          Hapus
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, index) => (
                        <tr
                          key={`${item.name}-${index}`}
                          className="border-t border-gray-200"
                        >
                          <td className="py-2 px-3 text-gray-700">
                            {item.name}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-700">
                            {item.qty}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-700">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-gray-900">
                            {formatCurrency(calculateItemTotal(item))}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ATTACHMENT */}
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-semibold text-gray-700">Lampiran</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Lampiran *
                </label>
                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="attachmentType"
                      value="foto"
                      checked={form.attachmentType === "foto"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          attachmentType: e.target.value,
                          attachmentUrl: "",
                          attachmentFile: null,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>Foto</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="attachmentType"
                      value="file"
                      checked={form.attachmentType === "file"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          attachmentType: e.target.value,
                          attachmentUrl: "",
                          attachmentFile: null,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span>URL</span>
                  </label>
                </div>
              </div>

              <div>
                {form.attachmentType === "foto" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Foto *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAttachmentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    />
                    {form.attachmentFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        File: {form.attachmentFile.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Lampiran *
                    </label>
                    <input
                      type="url"
                      value={form.attachmentUrl}
                      onChange={handleAttachmentChange}
                      placeholder="https://example.com/file.pdf"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PAYMENT */}
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-semibold text-gray-700">Pembayaran</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cash On Hand
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paymentCashOnHand}
                  onChange={(e) =>
                    setForm({ ...form, paymentCashOnHand: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cash Hold
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paymentCashHold}
                  onChange={(e) =>
                    setForm({ ...form, paymentCashHold: e.target.value })
                  }
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
                  min="0"
                  step="0.01"
                  value={form.paymentQris}
                  onChange={(e) =>
                    setForm({ ...form, paymentQris: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* TOTALS & SUMMARY */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Total Belanja:</span>
                <div className="font-semibold text-lg text-gray-900">
                  {formatCurrency(totalPayment)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total Dibayar:</span>
                <div className="font-semibold text-lg text-gray-900">
                  {formatCurrency(totalPaid)}
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-1 text-sm border-t border-blue-200">
              <div>
                <span className="text-gray-600">Status: </span>
                <span
                  className={`font-semibold ${
                    status === "LUNAS" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {status}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Sisa Hutang: </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(outstandingPay)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tipe Bayar: </span>
                <span className="font-semibold text-gray-900">
                  {typePaymentFormatted ? (
                    <div className="flex flex-wrap gap-2">
                      {typePaymentFormatted.split(";").map((payment, index) => (
                        <span
                          key={index}
                          className={`rounded-full px-3 py-1 text-xs font-small ${
                            paymentColor[payment]
                          }`}
                        >
                          {payment}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* NOTE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan (opsional)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              placeholder="Tambahkan catatan jika ada..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
