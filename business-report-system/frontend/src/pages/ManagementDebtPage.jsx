import { useState, useEffect } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import { formatDate, formatCurrency } from "../utils/helpers";
import { Trash2, Eye } from "lucide-react";
import Pagination from "../components/Pagination";
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

export default function ManagementDebtPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    cashHand: 0,
    cashHold: 0,
    qris: 0,
  });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [valueCards, setCards] = useState(0);
  const [openPayDebt, setOpenPayDebt] = useState(false);

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: Number(value) || 0,
    }));
  };

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

  const insufficientBalance = realtimeCards.find((card) => {
    const payment = paymentForm[card.type] ?? 0;
    return payment > card.amount;
  });
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

  const fetchDebts = () => {
    setLoading(true);
    // const params = new URLSearchParams();
    // if (statusFilter) params.append("status", statusFilter);
    // if (typeFilter) params.append("type", typeFilter);

    Promise.all([
      api.get("/debt-management"),
      // api.get("/debt/summary"),
    ])
      .then(([resDebts, resSummary]) => {
        setDebts(resDebts.data.data);
        // setSummary(resSummary.data.data);
      })
      .catch((err) => alert("Gagal mengambil data hutang"))
      .finally(() => setLoading(false));
  };

  const fetchDataCards = () => {
    api
      .get("/report/get-cards")
      .then((res) => setCards(res.data.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchDataCards();
    fetchDebts();
  }, [statusFilter, typeFilter]);

  const filterCategory = (item) => {
    // console.log(item);
    return item === null ? "HUTANG OPERASIONAL" : "HUTANG RESTOCK";
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    setSaving(true);

    if (insufficientBalance) {
      return alert("Input pembayaran melebihi saldo yang tersedia");
    }

    try {
      await api.post("debt-management", paymentForm);
      fetchDebts();
      fetchDataCards();
      alert("Pembayaran berhasil");
      setPaymentForm({
        cashHand: 0,
        cashHold: 0,
        qris: 0,
      });
    } catch (err) {
      alert(err.response?.data?.message || "Gagal membayar hutang");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const paginated = debts.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"> */}
      <div>
        <PageHeader
          title="Manajemen Hutang"
          description="Lihat ringkasan hutang, pembayaran hutang, dan laporan berdasarkan periode."
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Semua Status</option>
              <option value="HUTANG">Hutang</option>
              <option value="SEBAGIAN">Sebagian Lunas</option>
              <option value="LUNAS">Lunas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipe</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Semua Tipe</option>
              <option value="restock">Restock</option>
              <option value="operational">Operational</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* BUTTON PAY */}
      <div className="w-full flex justify-end">
        <button
          onClick={() => setOpenPayDebt(!openPayDebt)}
          className={`w-40 justify-center inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
            openPayDebt
              ? "bg-gray-100 text-black border border-gray-300 hover:bg-gray-200"
              : "bg-red-600 text-white hover:bg-red-700 shadow-sm"
          }`}
        >
          {openPayDebt ? "Batal" : "Bayar Hutang"}
        </button>
      </div>

      {/* TABLE PAY DEBT*/}
      <div
        className={`grid gap-6 ${openPayDebt ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
      >
        {openPayDebt && (
          <div className="order-1 lg:order-2">
            <div className="sticky top-6 max-h-[77vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* Outstanding */}
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 p-6 text-white shadow-lg">
                <p className="text-sm opacity-80">Sisa Hutang</p>

                <h2 className="mt-2 text-3xl font-bold">
                  {formatCurrency(valueCards?.realtimeOutstandingPay)}
                </h2>

                <p className="mt-2 text-xs opacity-70">
                  Total hutang yang belum dibayarkan.
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
                      Tidak dapat melakukan pelunasan/pembayaran hutang
                    </p>
                  </div>
                </div>
              )}

              {/* Saldo */}
              <div className="mb-6 mt-3">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">
                  Saldo Tersedia
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {realtimeCards.map((card) => (
                    <Cards
                      key={card.type}
                      variant="saldo"
                      type={card.type}
                      value={card.value}
                      className="w-full"
                    />
                  ))}
                </div>
              </div>

              <div className="my-6 border-t border-gray-100" />

              {/* Pembayaran */}
              {!emptyBalance && (
                <form onSubmit={handlePayment} className="space-y-4">
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
                      name="cashHand"
                      value={paymentForm.cashHand}
                      onChange={handlePaymentChange}
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
                      name="cashHold"
                      value={paymentForm.cashHold}
                      onChange={handlePaymentChange}
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
                      name="qris"
                      value={paymentForm.qris}
                      onChange={handlePaymentChange}
                      placeholder="0"
                      className={inputClass(readOnlyMap.qris)}
                    />
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <button
                      type="submit"
                      // disabled={saving}
                      className="h-full w-full px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Bayar
                    </button>
                  </div>
                </form>
              )}

              <div>
                <button></button>
              </div>
            </div>
          </div>
        )}

        <div
          className={`order-2 lg:order-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${openPayDebt ? "lg:col-span-2" : ""}`}
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[650px] flex flex-col">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <THead>
                  <Th>Tanggal</Th>
                  <Th align="center" hide="sm">
                    Jenis Hutang
                  </Th>
                  <Th align="center">Total Hutang</Th>
                  <Th align="center" hide="md">
                    Pemberi Hutang
                  </Th>
                  {/* <Th hide="lg">Status</Th> */}
                  <Th align="center">Sisa Hutang</Th>
                  <Th align="center">Status</Th>
                  <Th align="center">Aksi</Th>
                </THead>
                <tbody>
                  {paginated.map((item) => (
                    <Tr key={item.id}>
                      <Td className="text-gray-600">{formatDate(item.date)}</Td>
                      <Td align="center" hide="sm">
                        {filterCategory(item.restockId)}
                      </Td>
                      <Td align="center" className="font-medium">
                        {formatCurrency(item.totalDebt || 0)}
                      </Td>
                      <Td
                        align="center"
                        hide="md"
                        className="font-medium text-gray-900"
                      >
                        {item.nameDebt || "-"}
                      </Td>
                      <Td align="center" className="text-red-900">
                        {formatCurrency(item.outstandingPay || 0)}
                      </Td>
                      <Td align="center">
                        <StatusBadge status={item.status || "HUTANG"} />
                      </Td>
                      <Td align="center">
                        <div className="flex items-center justify-center gap-1">
                          <ActionButton
                            icon={Eye}
                            variant="view"
                            title="Lihat detail"
                            onClick={() => openView(item)}
                          />
                          <ActionButton
                            icon={Trash2}
                            variant="delete"
                            title="Hapus"
                            onClick={() => handleDelete(item.id)}
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

            <div className="border-t border-gray-100 px-4 py-3">
              <Pagination
                totalItems={debts.length}
                itemsPerPage={perPage}
                currentPage={page}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
