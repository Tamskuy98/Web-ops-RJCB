import { useState, useEffect } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate, formatCurrency } from "../utils/helpers";
import { Plus, Trash2, X, Eye } from "lucide-react";
import PageHeader from "../components/pageHeader";
import Cards from "../components/Cards";
import {
  StatusBadge,
  THead,
  Th,
  Tr,
  Td,
  TableEmpty,
  ActionButton,
} from "../components/TableUtils";

// ========================================
// HELPER REALTIME CARDS
// ========================================

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
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form, setForm] = useState(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState([]);
  const perPage = 10;
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [valueCards, setCards] = useState(0);

  const realtimeCards = [
    {
      type: "cashHand",
      amount: valueCards?.realtimeCashHand ?? 0,
      value: formatCurrency(valueCards?.realtimeCashHand),
    },
    {
      type: "cashHold",
      amount: valueCards?.realtimeCashHold ?? 0,
      value: formatCurrency(valueCards?.realtimeCashHold),
    },
    {
      type: "qris",
      amount: valueCards?.realtimeQris ?? 0,
      value: formatCurrency(valueCards?.realtimeQris),
    },
  ];

  const readOnlyMap = Object.fromEntries(
    realtimeCards.map((card) => [card.type, card.amount <= 0]),
  );

  const emptyBalance = Object.values(readOnlyMap).every(Boolean);

  const inputClass = (readOnly) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm transition-all outline-none ${
      readOnly
        ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
        : "border-gray-300 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
    }`;

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

  const fetchDataCards = () => {
    api
      .get("/report/get-cards")
      .then((res) => setCards(res.data.data))
      .catch(console.error);
  };

  console.log(valueCards);

  useEffect(() => {
    fetchItems();
    fetchDataCards();
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
  const totalPaid = calculateTotalPaid(cashOnHand, cashHold, qris) || 0;
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
      payload.append(
        "typePayment",
        typePayment === "none" ? "DIBAYAR DENGAN HUTANG" : typePayment,
      );
      payload.append("status", status);
      payload.append("outstandingPay", outstandingPay);
      payload.append("allQty", allQty);

      // Items
      form.items.forEach((item, idx) => {
        payload.append(`items[${idx}][name]`, item.name);
        payload.append(`items[${idx}][qty]`, item.qty);
        payload.append(`items[${idx}][price]`, item.price);
        payload.append(`items[${idx}][totalPrice]`, calculateItemTotal(item));
      });

      console.log([...payload.entries()]);

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

  // ---- VIEW DETAIL HANDLER ----
  const openDetailView = (item) => {
    // console.log(item);
    setSelectedHeader(item);
    // console.log(selectedHeader);
    // console.log(selectedHeader?.opsdetail);
    setDetailModalOpen(true);
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
      <div className="">
        <PageHeader
          title="Belanja Operasional"
          description="Pantau pengeluaran operasional, analisis transaksi, dan laporan belanja berdasarkan periode."
        />
      </div>
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3">
        <button
          onClick={openCreate}
          className="w-50 flex justify-center items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
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
            <table className="w-full text-xs sm:text-sm">
              <THead>
                <Th>Tanggal</Th>
                <Th hide="lg">Supplier</Th>
                <Th>Total Belanja</Th>
                <Th>Tipe Bayar</Th>
                <Th align="center">Status</Th>
                <Th hide="lg">Sisa Hutang</Th>
                <Th align="center">Aksi</Th>
              </THead>
              <tbody>
                {paginated.map((item) => (
                  <Tr key={item.id}>
                    <Td className="text-gray-600">{formatDate(item.date)}</Td>
                    <Td hide="lg" className="text-gray-700">
                      {item.supplier}
                    </Td>
                    <Td className="font-medium text-gray-900">
                      {formatCurrency(item.totalPayment || 0)}
                    </Td>
                    <Td>
                      {item.typePayment ? (
                        <div className="flex flex-wrap gap-1">
                          {item.typePayment.split(";").map((payment, index) => (
                            <StatusBadge key={index} status={payment} />
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </Td>
                    <Td align="center">
                      <StatusBadge
                        status={(
                          item?.debt?.[0]?.status ?? "LUNAS"
                        ).toUpperCase()}
                      />
                    </Td>
                    <Td hide="lg" className="text-red-900">
                      {formatCurrency(item.debt?.[0]?.outstandingPay || 0)}
                    </Td>
                    <Td align="center">
                      <div className="flex items-center justify-center gap-1">
                        <ActionButton
                          icon={Eye}
                          variant="view"
                          title="Lihat detail"
                          onClick={() => openDetailView(item)}
                        />
                      </div>
                    </Td>
                  </Tr>
                ))}
                {paginated.length === 0 && (
                  <TableEmpty message="Tidak ada data" />
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

          {/* CARDS */}
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Sisa Saldo Operasional
            </h3>
            <div className="grid grid-cols-1 gap-1">
              {realtimeCards.map((card) => (
                <Cards
                  key={card.type}
                  variant="saldo"
                  type={card.type}
                  value={card.value}
                  className="w-full h-20"
                />
              ))}
            </div>
          </div>

          {/* PAYMENT */}
          <div className="space-y-4 border-t border-gray-200 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Pembayaran
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Masukkan nominal pembayaran sesuai saldo operasional yang
                tersedia.
              </p>
            </div>

            {emptyBalance && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.82 21h16.36a2 2 0 001.71-3.14l-8.18-14a2 2 0 00-3.42 0z"
                    />
                  </svg>
                </div>

                <div>
                  <p className="font-medium text-amber-900">
                    Saldo operasional tidak tersedia
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Transaksi ini akan otomatis dicatat sebagai{" "}
                    <span className="font-semibold">hutang kepada owner</span>.
                  </p>
                </div>
              </div>
            )}

            {!emptyBalance && (
              <div className="space-y-4">
                {/* Cash On Hand */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>Cash On Hand</span>

                    {readOnlyMap.cashHand && (
                      <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                        Saldo Habis
                      </span>
                    )}
                  </label>

                  <input
                    readOnly={readOnlyMap.cashHand}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.paymentCashOnHand}
                    onChange={(e) =>
                      setForm({ ...form, paymentCashOnHand: e.target.value })
                    }
                    placeholder="0"
                    className={inputClass(readOnlyMap.cashHand)}
                  />
                </div>

                {/* Cash Hold */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>Cash Hold</span>

                    {readOnlyMap.cashHold && (
                      <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                        Saldo Habis
                      </span>
                    )}
                  </label>

                  <input
                    readOnly={readOnlyMap.cashHold}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.paymentCashHold}
                    onChange={(e) =>
                      setForm({ ...form, paymentCashHold: e.target.value })
                    }
                    placeholder="0"
                    className={inputClass(readOnlyMap.cashHold)}
                  />
                </div>

                {/* QRIS */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>QRIS</span>

                    {readOnlyMap.qris && (
                      <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                        Saldo Habis
                      </span>
                    )}
                  </label>

                  <input
                    readOnly={readOnlyMap.qris}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.paymentQris}
                    onChange={(e) =>
                      setForm({ ...form, paymentQris: e.target.value })
                    }
                    placeholder="0"
                    className={inputClass(readOnlyMap.qris)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* TOTALS & SUMMARY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Ringkasan Pembayaran
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Informasi total pembayaran dan status transaksi.
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  status === "LUNAS"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {status}
              </span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Belanja</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatCurrency(totalPayment)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Dibayar</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>

            {/* Detail */}
            <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Sisa Hutang</span>

                <span
                  className={`text-lg font-bold ${
                    outstandingPay > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(outstandingPay)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="pt-1 text-sm text-slate-500 whitespace-nowrap">
                  Tipe Pembayaran
                </span>

                <div className="flex flex-wrap justify-end gap-2">
                  {emptyBalance ? (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      DIBAYAR DENGAN HUTANG
                    </span>
                  ) : typePaymentFormatted ? (
                    typePaymentFormatted.split(";").map((payment, index) => (
                      <span
                        key={index}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          paymentColor[payment]
                        }`}
                      >
                        {payment}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </div>
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

      {/* MODAL VIEW DETAIL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setSelectedHeader(null);
          setDetailModalOpen(false);
        }}
        title={`Laporan Detail - ${selectedHeader ? new Date(selectedHeader.date).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}`}
      >
        {selectedHeader && (
          // <div>
          //   {selectedHeader?.opsdetail?.map((item) => (
          //     <div key={item.id}>
          //       <p>{item.name}</p>
          //       <p>{item.qty}</p>
          //       <p>{item.price}</p>
          //       <p>{item.totalPrice}</p>
          //     </div>
          //   ))}
          // </div>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">
                      Nama Barang
                    </th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">
                      Jumlah Barang
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">
                      Harga Per Barang
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">
                      Total Harga Barang
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHeader?.opsdetail?.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="py-2 px-3 text-center">{item.qty}</td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">
                Ringkasan Pembayaran
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-500">Total Belanja</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedHeader.totalPayment)}
                  </span>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Pembayaran
                  </p>

                  <div className="space-y-2">
                    {selectedHeader.cashOnHand > 0 && (
                      <div className="flex justify-between rounded-lg bg-green-50 px-3 py-2">
                        <span className="text-green-700">💵 Cash On Hand</span>
                        <span className="font-semibold text-green-700">
                          {formatCurrency(selectedHeader.cashOnHand)}
                        </span>
                      </div>
                    )}

                    {selectedHeader.cashHold > 0 && (
                      <div className="flex justify-between rounded-lg bg-yellow-50 px-3 py-2">
                        <span className="text-yellow-700">🟡 Cash Hold</span>
                        <span className="font-semibold text-yellow-700">
                          {formatCurrency(selectedHeader.cashHold)}
                        </span>
                      </div>
                    )}

                    {selectedHeader.qris > 0 && (
                      <div className="flex justify-between rounded-lg bg-blue-50 px-3 py-2">
                        <span className="text-blue-700">📱 QRIS</span>
                        <span className="font-semibold text-blue-700">
                          {formatCurrency(selectedHeader.qris)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status Hutang</span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedHeader.debt?.[0]?.status === "LUNAS"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedHeader.debt?.[0]?.status ?? "-"}
                    </span>
                  </div>

                  {selectedHeader.debt?.[0]?.outstandingPay > 0 && (
                    <div className="mt-3 flex justify-between">
                      <span className="text-gray-500">Sisa Hutang</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(selectedHeader.debt[0].outstandingPay)}
                      </span>
                    </div>
                  )}
                </div>
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
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
