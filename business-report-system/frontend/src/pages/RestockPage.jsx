import { useState, useEffect } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate, formatCurrency } from "../utils/helpers";
import { Plus, Trash2, Eye, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
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

const defaultFormState = {
  date: "",
  supplier: "",
  items: [],
  newItem: {
    productid: "",
    name: "",
    qty: "",
    priceCost: "",
    price: "",
  },
  attachmentType: "foto",
  attachmentFile: null,
  attachmentUrl: "",
  paymentCashOnHand: "",
  paymentCashHold: "",
  paymentQris: "",
  note: "",
  category: "RESTOCK",
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
  return items.reduce((sum, item) => sum + Number(item.price || 0), 0);
};

const calculateTotalPaid = (cashOnHand, cashHold, qris) => {
  return Number(cashOnHand || 0) + Number(cashHold || 0) + Number(qris || 0);
};

const calculateTypePayment = (cashOnHand, cashHold, qris) => {
  const types = [];
  if (Number(cashOnHand || 0) > 0) types.push("CASH ON HAND");
  if (Number(cashHold || 0) > 0) types.push("CASH HOLD");
  if (Number(qris || 0) > 0) types.push("QRIS");
  return types.length > 0 ? types.join(";") : "";
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

  if (totalPaid > totalPayment) {
    errors.push("Total Dibayar tidak boleh lebih besar dari Total Belanja");
  }

  return errors;
};

// ========================================
// MAIN COMPONENT
// ========================================

export default function RestockPage() {
  const [products, setProducts] = useState([]);
  const [restocks, setRestocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRestock, setSelectedRestock] = useState(null);
  const [form, setForm] = useState(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState([]);
  const perPage = 10;
  const [valueCards, setCards] = useState(0);

  // ---- FETCH DATA ----
  const fetchRestocks = () => {
    setLoading(true);
    Promise.all([api.get("/restock"), api.get("/products")])
      .then(([resStock, resProduct]) => {
        setRestocks(resStock.data.data);
        setProducts(resProduct.data.data);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        alert("Gagal mengambil data");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRestocks();
    fetchDataCards();
  }, []);

  const paginated = restocks.slice((page - 1) * perPage, page * perPage);

  // ---- HANDLE CALCULATIONS ----
  const totalPayment = Number(calculateTotalPayment(form.items));
  // console.log(totalPayment);
  const cashOnHand = Number(form.paymentCashOnHand || 0);
  const cashHold = Number(form.paymentCashHold || 0);
  const qris = Number(form.paymentQris || 0);
  const totalPaid = calculateTotalPaid(cashOnHand, cashHold, qris);
  const typePayment = calculateTypePayment(cashOnHand, cashHold, qris);
  const typePaymentFormatted = formatTypePayment(cashOnHand, cashHold, qris);
  const status = calculateStatus(totalPayment, totalPaid);
  const outstandingPay = calculateOutstandingPay(totalPayment, totalPaid);
  const allQty = calculateAllQty(form.items);

  // ---- CHECK AND BALANCE SALDO ----
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

  const allPayment = {
    cashHand: cashOnHand,
    cashHold: cashHold,
    qris: qris,
  };

  const insufficientBalance = realtimeCards.find((card) => {
    const payment = allPayment[card.type] ?? 0;
    return payment > card.amount;
  });

  const inputClass = (readOnly) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm transition-all outline-none ${
      readOnly
        ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
        : "border-gray-300 bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100"
    }`;

  const fetchDataCards = () => {
    api
      .get("/report/get-cards")
      .then((res) => setCards(res.data.data))
      .catch(console.error);
  };

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

  const openView = (restock) => {
    setSelectedRestock(restock);
    setViewModalOpen(true);
  };

  // ---- ITEM MANAGEMENT ----
  const handleNewItemChange = (field, value) => {
    let newItem = {
      ...form.newItem,
      [field]: value,
    };

    if (field === "productid") {
      const product = products.find((p) => p.id === Number(value));
      newItem.name = product ? product.name : "";
      newItem.qty = "";
      newItem.priceCost = product ? product.priceCost : "";
      newItem.price = "";
    }

    if (field === "qty" && form.newItem.priceCost) {
      newItem.price = Number(form.newItem.priceCost) * Number(value);
    }

    setForm({
      ...form,
      newItem,
    });
  };

  const addItem = () => {
    const { productid, name, qty, price, priceCost } = form.newItem;

    const itemErrors = [];
    if (!productid) {
      itemErrors.push("Produk harus dipilih");
    }
    if (!qty || Number(qty) <= 0) {
      itemErrors.push("Jumlah barang harus lebih dari 0");
    }
    if (!price || Number(price) <= 0) {
      itemErrors.push("Harga barang harus lebih dari 0");
    }

    if (itemErrors.length > 0) {
      setValidationErrors(itemErrors);
      return;
    }

    setValidationErrors([]);
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          productid: Number(productid),
          name: name,
          qty: Number(qty),
          priceCost: Number(priceCost),
          price: Number(price),
        },
      ],
      newItem: {
        productid: "",
        name: "",
        qty: "",
        priceCost: "",
        price: "",
      },
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

    if (insufficientBalance) {
      return alert("Input pembayaran melebihi saldo yang tersedia");
    }

    setSaving(true);
    setValidationErrors([]);

    try {
      const payload = new FormData();

      // Basic info
      payload.append("date", new Date(form.date).toISOString());
      payload.append("supplier", form.supplier.trim());
      payload.append("note", form.note?.trim() || "");
      payload.append("category", form.category);

      // Attachment
      payload.append("attachmentType", form.attachmentType);
      payload.append("attachment", form.attachmentFile);

      // if (form.attachmentType === "foto" && form.attachmentFile) {
      //   payload.append("attachment", form.attachmentFile);
      // } else if (form.attachmentType === "url") {
      //   payload.append("attachment", form.attachmentUrl.trim());
      // }

      // Payment info
      payload.append("cashOnHand", cashOnHand);
      payload.append("cashHold", cashHold);
      payload.append("qris", qris);
      payload.append("totalPayment", totalPayment);
      payload.append(
        "typePayment",
        typePayment === "" ? "DIBAYAR DENGAN HUTANG" : typePayment,
      );
      payload.append("status", status);
      payload.append("outstandingPay", outstandingPay);
      payload.append("allQty", allQty);

      // Items
      form.items.forEach((item, idx) => {
        payload.append(`items[${idx}][productid]`, Number(item.productid));
        payload.append(`items[${idx}][name]`, item.name);
        payload.append(`items[${idx}][qty]`, Number(item.qty));
        payload.append(`items[${idx}][price]`, Number(item.price));
      });
      console.log(Object.fromEntries(payload.entries()));
      await api.post("/restock", payload, {
        // headers: {
        //   "Content-Type": "multipart/form-data",
        // },
      });

      closeModal();
      fetchRestocks();
      alert("Data restock berhasil disimpan");
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
    if (!confirm("Hapus data restock ini?")) return;

    try {
      await api.delete(`/restock/${id}`);
      fetchRestocks();
      alert("Data berhasil dihapus");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <PageHeader
          title="Pengadaan Produk"
          description="Tambah stok produk, analisis transaksi penambahan produk, dan laporan berdasarkan periode."
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
                <Th align="center" hide="sm">
                  Total jenis produk
                </Th>
                <Th align="center" hide="md">
                  Total produk
                </Th>
                <Th>Total Bayar</Th>
                <Th hide="lg">Supplier</Th>
                <Th>Tipe Bayar</Th>
                <Th align="center">Status</Th>
                <Th hide="lg">Sisa Hutang</Th>
                <Th align="center">Aksi</Th>
              </THead>
              <tbody>
                {paginated.map((item) => (
                  <Tr key={item.id}>
                    <Td className="text-gray-600">{formatDate(item.date)}</Td>
                    <Td align="center" hide="sm">
                      {item.restockDetail?.length || 0}
                    </Td>
                    <Td align="center" hide="md" className="font-medium">
                      {item.allQty}
                    </Td>
                    <Td className="font-medium text-gray-900">
                      {formatCurrency(item.totalPayment || 0)}
                    </Td>
                    <Td hide="lg" className="text-gray-700">
                      {item.supplier}
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
                        status={item?.debt?.[0]?.status || "LUNAS"}
                      />
                    </Td>
                    <Td hide="lg" className="text-red-900">
                      {formatCurrency(item?.debt?.[0]?.outstandingPay || 0)}
                    </Td>
                    <Td align="center">
                      <div className="flex items-center justify-center gap-1">
                        <ActionButton
                          icon={Eye}
                          variant="view"
                          title="Lihat detail"
                          onClick={() => openView(item)}
                        />
                        {/* <ActionButton
                          icon={Trash2}
                          variant="delete"
                          title="Hapus"
                          onClick={() => handleDelete(item.id)}
                        /> */}
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
              totalItems={restocks.length}
              itemsPerPage={perPage}
              currentPage={page}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Tambah Restock Produk"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[80vh] overflow-y-auto"
        >
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
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Informasi Dasar
            </h3>
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
                  onChange={(e) =>
                    setForm({ ...form, supplier: e.target.value })
                  }
                  placeholder="Nama supplier"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* ITEMS SECTION */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Tambah Item</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Produk *
                </label>
                <select
                  value={form.newItem.productid}
                  onChange={(e) =>
                    handleNewItemChange("productid", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                >
                  <option value="">Pilih Produk</option>
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
                    readOnly
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm bg-gray-50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus size={14} /> Tambah Item
              </button>
            </div>

            {/* ITEMS LIST */}
            {form.items.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  Daftar Item ({form.items.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white">
                      <tr>
                        <th className="text-left py-2 px-3 text-gray-600">
                          Nama Produk
                        </th>
                        <th className="text-right py-2 px-3 text-gray-600">
                          Qty
                        </th>
                        <th className="text-right py-2 px-3 text-gray-600">
                          Harga Satuan
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
                          key={`${item.productid}-${index}`}
                          className="border-t border-gray-200"
                        >
                          <td className="py-2 px-3 text-gray-700">
                            {item.name}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-700">
                            {item.qty}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-700">
                            {formatCurrency(item.priceCost)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-gray-900">
                            {formatCurrency(item.price)}
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
          {/* <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Lampiran</h3>
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
                      value="url"
                      checked={form.attachmentType === "url"}
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
          </div> */}

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
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Pembayaran</h3>

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
                    status === "LUNAS" ? "text-green-600" : "text-yellow-600"
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
                    <div className="flex flex-wrap gap-2 mt-1">
                      {typePaymentFormatted.split(";").map((payment, index) => (
                        <span
                          key={index}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
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

          {/* CATEGORY & NOTE */}
          <div className="border-b pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                >
                  <option value="RESTOCK">RESTOCK</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
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
              disabled={saving || form.items.length === 0}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAIL MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Detail Restock"
      >
        {selectedRestock && (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            {/* BASIC INFO */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Informasi Dasar
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Supplier</p>
                  <p className="font-medium text-gray-900">
                    {selectedRestock.supplier}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedRestock.date)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Category</p>
                  <p className="font-medium text-gray-900">
                    {selectedRestock.category}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p
                    className={`font-medium ${
                      selectedRestock.status === "LUNAS"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {selectedRestock.status}
                  </p>
                </div>
              </div>
              {selectedRestock.note && (
                <div className="mt-3">
                  <p className="text-gray-600 text-sm">Note</p>
                  <p className="text-gray-900">{selectedRestock.note}</p>
                </div>
              )}
            </div>

            {/* ITEMS */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Items ({selectedRestock.restockDetail?.length || 0})
              </h3>
              <div className="space-y-2">
                {selectedRestock.restockDetail?.map((detail, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-gray-900">{detail.name}</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(detail.price)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">Qty: {detail.qty}</p>
                    <p className="text-sm text-gray-600">
                      Subtotal: {formatCurrency(detail.qty * detail.price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* PAYMENT INFO */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Informasi Pembayaran
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Qty</span>
                  <span className="font-medium text-gray-900">
                    {selectedRestock.allQty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Belanja</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(selectedRestock.totalPayment)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash On Hand</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(selectedRestock.cashOnHand)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash Hold</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(selectedRestock.cashHold)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">QRIS</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(selectedRestock.qris)}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sisa Hutang</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(selectedRestock.outstandingPay)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ATTACHMENT */}
            {selectedRestock.attachment && (
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Attachment</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Type: {selectedRestock.attachmentType}
                </p>
                <p className="text-sm text-gray-900 break-all">
                  {selectedRestock.attachment}
                </p>
              </div>
            )}

            {/* DEBT INFO */}
            {selectedRestock.debt?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Debt History
                </h3>
                <div className="space-y-2">
                  {selectedRestock.debt?.map((debt, idx) => (
                    <div key={idx} className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-gray-900">
                          {debt.nameDebt}
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(debt.totalDebt)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Status:{" "}
                        <span className="font-medium">{debt.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
