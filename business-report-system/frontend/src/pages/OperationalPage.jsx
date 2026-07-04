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
    kategoriBarang: "gas",
    kategoriLainnyaText: "",
    jumlahBarang: "",
    hargaBarang: "",
  },
  attachmentType: "foto",
  attachmentUrl: "",
  attachmentFile: null,
  paymentCashOnHand: "",
  paymentCashHold: "",
  paymentQris: "",
  note: "",
};

export default function OperationalPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  //Get Record
  const fetchItems = () => {
    setLoading(true);
    api
      .get("/operational")
      .then((res) => setItems(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreate = () => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      supplier: "",
      items: [],
      newItem: {
        kategoriBarang: "gas",
        kategoriLainnyaText: "",
        jumlahBarang: "",
        hargaBarang: "",
      },
      //attachmentType: "foto", -> Ganti kolom upload
      attachmentType: "foto",
      attachmentUrl: "",
      attachmentFile: null,
      paymentCashOnHand: "",
      paymentCashHold: "",
      paymentQris: "",
      note: "",
    });
    setModalOpen(true);
  };

  const totalBelanja = form.items.reduce(
    (sum, item) => sum + Number(item.jumlahBarang) * Number(item.hargaBarang),
    0,
  );

  const totalPaid =
    Number(form.paymentCashOnHand || 0) +
    Number(form.paymentCashHold || 0) +
    Number(form.paymentQris || 0);

  const cashOnHand = Number(form.paymentCashOnHand || 0);
  const cashHold = Number(form.paymentCashHold || 0);
  const qris = Number(form.paymentQris || 0);

  // build semicolon-separated type string for backend (order: qris;cashonhand;cashhold)
  const presentTypes = [];
  if (qris > 0) presentTypes.push("qris");
  if (cashOnHand > 0) presentTypes.push("cashonhand");
  if (cashHold > 0) presentTypes.push("cashhold");
  const typePaymentString = presentTypes.join(";") || "none";

  const paymentTypes =
    typePaymentString === "none" ? "Belum Bayar" : typePaymentString;

  const status = totalPaid >= totalBelanja ? "Lunas" : "Hutang";

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
    const { kategoriBarang, kategoriLainnyaText, jumlahBarang, hargaBarang } =
      form.newItem;
    if (!jumlahBarang || Number(jumlahBarang) <= 0) {
      alert("Jumlah barang harus diisi dan lebih besar dari 0.");
      return;
    }
    if (!hargaBarang || Number(hargaBarang) <= 0) {
      alert("Harga barang harus diisi dan lebih besar dari 0.");
      return;
    }
    if (kategoriBarang === "lainnya" && !kategoriLainnyaText.trim()) {
      alert("Silakan isi kategori lainnya.");
      return;
    }

    setForm({
      ...form,
      items: [
        ...form.items,
        {
          kategoriBarang,
          kategoriLainnyaText:
            kategoriBarang === "lainnya" ? kategoriLainnyaText.trim() : null,
          jumlahBarang: Number(jumlahBarang),
          hargaBarang: Number(hargaBarang),
          total: Number(jumlahBarang) * Number(hargaBarang),
        },
      ],
      newItem: {
        kategoriBarang: "gas",
        kategoriLainnyaText: "",
        jumlahBarang: "",
        hargaBarang: "",
      },
    });
  };

  const removeItem = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const handleAttachmentChange = (e) => {
    if (form.attachmentType === "foto") {
      setForm({
        ...form,
        attachmentFile: e.target.files?.[0] || null,
      });
      return;
    }

    setForm({
      ...form,
      attachmentUrl: e.target.value,
    });
  };

  const renderItemName = (item) => {
    if (item.kategoriBarang) {
      return item.kategoriBarang === "lainnya"
        ? item.kategoriLainnyaText || "Lainnya"
        : item.kategoriBarang.replaceAll("_", " ");
    }
    if (item.items?.name) return item.items.name;
    return "-";
  };

  const renderPaymentLabel = (item) => {
    if (item.typePayment) {
      if (item.typePayment === "mixed") return "Cash + QRIS";
      if (item.typePayment === "cash") return "Cash";
      if (item.typePayment === "qris") return "QRIS";
      return item.typePayment;
    }
    if (Number(item.cash || 0) > 0 && Number(item.qris || 0) > 0) {
      return "Cash + QRIS";
    }
    if (Number(item.cash || 0) > 0) return "Cash";
    if (Number(item.qris || 0) > 0) return "QRIS";
    return "-";
  };

  const renderItemTotal = (item) => {
    if (item.total) return Number(item.total);
    if (item.quantity && item.hargaBarang) {
      return Number(item.quantity) * Number(item.hargaBarang);
    }
    if (item.quantity && item.purchasePrice) {
      return Number(item.quantity) * Number(item.purchasePrice);
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.items.length === 0) {
      alert("Please add at least one operational item.");
      return;
    }

    if (!form.attachmentType) {
      alert("Please select an attachment type.");
      return;
    }

    if (form.attachmentType === "foto" && !form.attachmentFile) {
      alert("Please upload a photo attachment.");
      return;
    }

    if (form.attachmentType === "file" && !form.attachmentUrl.trim()) {
      alert("Please provide an attachment URL.");
      return;
    }

    if (totalPaid > totalBelanja) {
      alert("Total Dibayar tidak boleh lebih besar dari Total Belanja.");
      return;
    }

    const cashTotal = cashOnHand + cashHold;
    const qrisTotal = qris;
    const typePaymentCode = typePaymentString; // semicolon-separated string or 'none'

    const outstandingPay = Math.max(0, totalBelanja - totalPaid);

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("date", form.date);
      payload.append("supplier", form.supplier);
      payload.append("attachmentType", form.attachmentType);
      if (form.attachmentType === "foto") {
        payload.append("attachmentFile", form.attachmentFile);
      } else {
        payload.append("attachmentUrl", form.attachmentUrl);
      }
      payload.append("cashOnHand", cashOnHand);
      payload.append("cashHold", cashHold);
      payload.append("qris", qrisTotal);
      payload.append("totalPaid", totalPaid);
      payload.append("typePayment", typePaymentCode);
      payload.append("status", status);
      payload.append("note", form.note || "");
      payload.append("outstandingPay", outstandingPay);

      form.items.forEach((item, idx) => {
        payload.append(`items[${idx}][kategoriBarang]`, item.kategoriBarang);
        payload.append(
          `items[${idx}][kategoriLainnyaText]`,
          item.kategoriLainnyaText || "",
        );
        payload.append(`items[${idx}][jumlahBarang]`, item.jumlahBarang);
        payload.append(`items[${idx}][hargaBarang]`, item.hargaBarang);
        payload.append(`items[${idx}][total]`, renderItemTotal(item));
      });

      await api.post("/operational", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
    if (!confirm("Delete this operational expenditure record?")) return;
    try {
      await api.delete(`/operational/${id}`);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const paginated = items.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Belanja Operasional
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus size={16} /> Add
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
                  <th className="text-right py-3 px-4 font-medium text-gray-600">
                    Total Payment
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Payment Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    outstanding debt
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => {
                  const total =
                    Number(item.quantity || 0) *
                    Number(item.purchasePrice || 0);
                  const paymentLabel =
                    item.typePayment === "mixed"
                      ? "Cash + QRIS"
                      : item.typePayment === "cash"
                        ? "Cash"
                        : item.typePayment === "qris"
                          ? "QRIS"
                          : "-";
                  const categories = {
                    1: "gas",
                    2: "minyak",
                    3: "token_listrik",
                    4: "plastik_bungkus",
                    5: "kertas_bungkus",
                    6: "saus",
                    7: "lainnya",
                  };
                  const category = categories[item.itemsId] || "-";
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(item.date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {category}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {paymentLabel}
                      </td>
                      <td className="py-3 px-4 text-gray-600 capitalize">
                        {item.status || "-"}
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
                  );
                })}
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
        title="Add Operasional"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* header: date + supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal
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
          </div>

          {/* item form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori Barang
              </label>
              <select
                value={form.newItem.kategoriBarang}
                onChange={(e) =>
                  handleNewItemChange("kategoriBarang", e.target.value)
                }
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

              {form.newItem.kategoriBarang === "lainnya" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Lainnya
                  </label>
                  <input
                    type="text"
                    value={form.newItem.kategoriLainnyaText}
                    onChange={(e) =>
                      handleNewItemChange("kategoriLainnyaText", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Barang
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.newItem.jumlahBarang}
                  onChange={(e) =>
                    handleNewItemChange("jumlahBarang", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Barang
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.newItem.hargaBarang}
                  onChange={(e) =>
                    handleNewItemChange("hargaBarang", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end md:col-span-2">
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus size={14} /> Tambah Item
              </button>
            </div>

            {form.items.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  Daftar Item
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
                          key={`${item.kategoriBarang}-${index}`}
                          className="border-t border-gray-200"
                        >
                          <td className="py-2 px-3 text-gray-700">
                            {renderItemName(item)}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-700">
                            {item.jumlahBarang}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-700">
                            {formatCurrency(item.hargaBarang)}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-700">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50"
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

          {/* attachment + payments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachment Type
              </label>
              <div className="flex gap-3">
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
                  />
                  Foto
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
                  />
                  Url
                </label>
              </div>
            </div>
            <div>
              {form.attachmentType === "foto" ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAttachmentChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={form.attachmentUrl}
                  onChange={handleAttachmentChange}
                  placeholder="Attachment URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  required
                />
              )}
            </div>
          </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Bayar
              </label>
              <div className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900">
                {formatCurrency(totalBelanja)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Dibayar
              </label>
              <div className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900">
                {formatCurrency(totalPaid)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600">
              Status: <span className="font-semibold capitalize">{status}</span>
            </div>
            <div className="text-sm text-gray-600">
              Payment Type:{" "}
              <span className="font-semibold">{paymentTypes}</span>
            </div>
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
