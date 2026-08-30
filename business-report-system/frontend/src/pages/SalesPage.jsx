import { useState, useEffect } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency } from "../utils/helpers";
import { Plus, Pencil, Trash2, X, Eye } from "lucide-react";
import Cards from "../components/Cards";
import PageHeader from "../components/pageHeader";
import {
  StatusBadge,
  TableContainer,
  THead,
  Th,
  Tr,
  Td,
  TableEmpty,
  ActionButton,
} from "../components/TableUtils";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [editId, setEditId] = useState(null);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [selected, setSelected] = useState([]);
  const [totalHold, setCardsHold] = useState(0);

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

  const fetchProduct = () => {
    api
      .get("/products")
      .then((res) => setProducts(res.data.data))
      .catch(console.error);
  };

  const fetchDataCards = () => {
    api
      .get("/report/get-cards")
      .then((res) => setCardsHold(res.data.data.realtimeCashHold))
      .catch(console.error);
  };

  useEffect(() => {
    fetchSales();
    fetchProduct();
    fetchDataCards();
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

  const handleAddProductToList = () => {
    const { productId, quantity, priceSell } = form.tempItem;

    if (!productId || !quantity || !priceSell) {
      alert("Silahkan Lengkapi Data Produk Terjual");
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
    if (!confirm("Yakin Menghapus Data Laporan Penjualan ini?")) return;
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
      alert(
        err.response?.data?.message || "Gagal Menghapus Data Laporan Penjualan",
      );
    }
  };

  const getFilteredSales = () => {
    let data = sales;

    // Filter tanggal
    if (dateFilter) {
      data = data.filter(
        (sale) =>
          new Date(sale.date).toISOString().split("T")[0] === dateFilter,
      );
    }

    // Mode setor
    if (openDeposit) {
      data = data.filter(
        (sale) => sale.typePayment.includes("Cash") && sale.isDeposit === "N",
      );
    }

    return data;
  };

  const openDetailView = (header) => {
    setSelectedHeader(header);
    setDetailModalOpen(true);
  };

  //HANDLE SAVE SALE & DEPOSIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.items.length === 0) {
      alert("Pilih Produk Terjual Terlebih Dahulu");
      return;
    }

    // Validation: Cash + QRIS must equal Total Penjualan
    const totalPenjualan = calculateGrandTotal();
    const cashAmount = parseFloat(form.cash) || 0;
    const qrisAmount = parseFloat(form.qris) || 0;
    const totalPayment = cashAmount + qrisAmount;

    if (Math.abs(totalPayment - totalPenjualan) > 0.01) {
      alert(
        `Total pembayaran Cash atau QRIS (${formatCurrency(totalPayment)}) tidak sesuai dengan Total Penjualan/Pendapatan (${formatCurrency(totalPenjualan)}).`,
      );
      return;
    }

    if (!editId) {
      const dateAlreadyExists = sales.some(
        (sale) => new Date(sale.date).toISOString().split("T")[0] === form.date,
      );
      if (dateAlreadyExists) {
        alert(
          "Laporan Penjualan Hari ini Telah di Input. Silahkan hubungi admin untuk edit Apabila terdapat kesalahan Laporan",
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
      fetchProduct();
    } catch (err) {
      alert(
        err.response?.data?.message || "Gagal Menyimpan Data Laporan Penjualan",
      );
    } finally {
      setSaving(false);
    }
  };

  const HandleSubmitDeposit = async (e) => {
    e.preventDefault();

    if (selected === 0) {
      alert("Silahkan pilih penjualan yang ingin di setorkan");
      return;
    }

    if (
      totalDeposit <= 0 ||
      !totalDeposit ||
      typeof totalDeposit !== "number"
    ) {
      alert("Error total setoran");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: selected,
        totalDeposit: totalDeposit,
      };
      const res = await api.post("/deposit", payload);
      console.log(payload);
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal Menyimpan Data Setoran");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectDepo = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const totalDeposit = sales
    .filter((item) => selected.includes(item.id))
    .reduce((sum, item) => sum + item.cash, 0);

  return (
    <div className="space-y-4">
      {/* //HEADER */}
      <PageHeader
        title="Laporan Penjualan"
        description="Lihat ringkasan penjualan, analisis transaksi, dan laporan berdasarkan periode."
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Plus size={16} /> Tambah Laporan Penjualan
          </button>
          <button
            onClick={() => setOpenDeposit(!openDeposit)}
            className={`
    inline-flex items-center gap-2 rounded-xl px-4 py-2
    text-sm font-medium transition-all duration-200
    ${
      openDeposit
        ? "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
        : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
    }
  `}
          >
            {openDeposit ? "Batal" : "Setor Uang Cash Penjualan"}
          </button>
        </div>

        <div className="relative w-full sm:w-auto">
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
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        //TABEL RECORD

        <div
          className={`grid gap-4 ${openDeposit ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
        >
          {openDeposit && (
            <div className="order-1 lg:order-2">
              <div className="sticky top-6 max-h-[77vh] overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  {/* Saldo */}
                  <Cards
                    variant="saldo"
                    type="cashHold"
                    value={formatCurrency(totalHold)}
                    className="mb-5 h-24 w-full"
                  />

                  {/* Ringkasan */}
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Total Setoran</p>

                    <h3 className="mt-1 text-2xl font-bold text-gray-900">
                      {formatCurrency(totalDeposit)}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Total nominal dari transaksi yang dipilih.
                    </p>
                  </div>

                  {/* Action */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={HandleSubmitDeposit}
                      className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
                    >
                      Setorkan
                    </button>

                    <button
                      onClick={() => setSelected([])}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div
            className={`order-2 lg:order-1 ${openDeposit ? "col-span-2" : "col-span-1"}`}
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <THead>
                    <Th>Tanggal</Th>
                    <Th align="center" hide="sm">
                      Total Terjual
                    </Th>
                    <Th align="center">Total Pendapatan</Th>
                    <Th align="center" hide="xl">
                      Cash
                    </Th>
                    <Th align="center" hide="xl">
                      QRIS
                    </Th>
                    <Th align="center" hide="md">
                      Tipe Pembayaran
                    </Th>
                    <Th align="center" hide="lg">
                      Keuntungan
                    </Th>
                    <Th align="center">Setor</Th>
                    <Th align="center">Status</Th>
                    <Th align="center">Aksi</Th>
                    {openDeposit && <Th align="center"></Th>}
                  </THead>
                  <tbody>
                    {getFilteredSales()
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((headersale) => (
                        <Tr key={headersale.id}>
                          <Td>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {new Date(headersale.date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    weekday: "short",
                                  },
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(headersale.date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          </Td>
                          <Td
                            align="center"
                            hide="sm"
                            className="font-medium text-gray-900"
                          >
                            {headersale.allquantity}
                          </Td>
                          <Td
                            align="center"
                            className="font-medium text-gray-900"
                          >
                            {formatCurrency(
                              openDeposit ? headersale.cash : headersale.total,
                            )}
                          </Td>
                          <Td
                            align="center"
                            hide="xl"
                            className="font-medium text-gray-900"
                          >
                            {formatCurrency(headersale.cashReport || 0)}
                          </Td>
                          <Td
                            align="center"
                            hide="xl"
                            className="font-medium text-gray-900"
                          >
                            {formatCurrency(headersale.qris || 0)}
                          </Td>
                          <Td align="center" hide="md">
                            <StatusBadge
                              status={formatPaymentType(
                                openDeposit ? "Cash" : headersale.typePayment,
                              )}
                            />
                          </Td>
                          <Td
                            align="center"
                            hide="lg"
                            className="font-medium text-green-600"
                          >
                            {formatCurrency(headersale.profit)}
                          </Td>
                          <Td
                            align="center"
                            className="font-medium text-gray-900"
                          >
                            {formatCurrency(headersale.cash || 0)}
                          </Td>
                          <Td align="center">
                            <StatusBadge
                              status={
                                headersale.isDeposit === "Y" ||
                                headersale.cash <= 0
                                  ? "Sudah Disetor"
                                  : "Belum Disetor"
                              }
                            />
                          </Td>
                          <Td align="center">
                            <div className="flex items-center justify-center gap-1">
                              <ActionButton
                                icon={Eye}
                                variant="view"
                                title="Lihat detail"
                                onClick={() => openDetailView(headersale)}
                              />
                            </div>
                          </Td>
                          {openDeposit && (
                            <Td align="center">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={selected.includes(headersale.id)}
                                  onChange={() =>
                                    handleSelectDepo(headersale.id)
                                  }
                                />
                              </div>
                            </Td>
                          )}
                        </Tr>
                      ))}
                    {getFilteredSales().length === 0 && (
                      <TableEmpty message="Tidak ada data Penjualan" />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* //MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit Laporan Penjualan" : "Tambah Laporan Penjualan"}
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-96 overflow-y-auto"
        >
          {/* DATE */}
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

          {/* PRODUCT FORM INPUT */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Tambah Produk
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produk
              </label>
              <select
                value={form.tempItem.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              >
                <option value="">Pilih Produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Terjual
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
                  Harga Jual
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
                  <Plus size={16} className="inline" />
                </button>
              </div>
            </div>
          </div>

          {/* PRODUCTS LIST */}
          {form.items.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                List Produk Terjual
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
                    Total Pendapatan:
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
                Pembayaran
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uang Cash
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
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || form.items.length === 0}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Simpan"}
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
        title={`Laporan Detail - ${selectedHeader ? new Date(selectedHeader.date).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}`}
      >
        {selectedHeader && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">
                      Produk
                    </th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">
                      Jumlah Terjual (Pcs)
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">
                      Harga Jual
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">
                      Total Pendapatan
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">
                      Total Keuntungan
                    </th>
                    {/* <th className="text-center py-2 px-3 font-medium text-gray-600">
                      Aksi
                    </th> */}
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
                        {/* <div className="flex items-center justify-center gap-1">
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
                        </div> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Terjual (Pcs):</span>
                <span className="font-semibold text-gray-900">
                  {selectedHeader.allquantity}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Pendapatan:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(selectedHeader.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Uang Cash:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(selectedHeader.cash)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total QRIS:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(selectedHeader.qris)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-600">Total Keuntungan:</span>
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
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
