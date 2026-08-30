import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  User,
  FileText,
  Hash,
  Wallet,
  CheckCircle2,
} from "lucide-react";

export default function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  const isIncome = transaction.type === "IN";

  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-center border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Detail Transaksi
          </h2>
        </div>

        {/* Nominal */}
        <div className="px-5 py-6 text-center">
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              isIncome ? "bg-green-50" : "bg-red-50"
            }`}
          >
            {isIncome ? (
              <ArrowDownLeft size={28} className="text-green-600" />
            ) : (
              <ArrowUpRight size={28} className="text-red-600" />
            )}
          </div>

          <p
            className={`mt-4 text-3xl font-bold ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            {transaction.description}
          </p>
        </div>

        {/* Detail */}
        <div className="border-t border-gray-100 px-5">
          <DetailRow
            icon={CalendarDays}
            label="Tanggal & Waktu"
            value={transaction.date}
          />

          <DetailRow
            icon={Wallet}
            label="Sumber Dana"
            value={transaction.source}
          />

          <DetailRow
            icon={CreditCard}
            label="Metode Pembayaran"
            value={transaction.paymentMethod}
          />

          <DetailRow
            icon={User}
            label="Dibuat Oleh"
            value={transaction.createdBy}
          />

          <DetailRow
            icon={FileText}
            label="Keterangan"
            value={transaction.description}
          />

          <DetailRow
            icon={Hash}
            label="ID Transaksi"
            value={transaction.transactionId}
          />
        </div>

        <TransactionSourceDetail
          detail={transaction.detail}
          modul={transaction.modul}
        />

        {/* Saldo */}
        {(transaction.balanceBefore !== undefined ||
          transaction.balanceAfter !== undefined) && (
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">
              Ringkasan Saldo
            </p>

            <div className="grid grid-cols-2 gap-3">
              <BalanceItem
                label="Saldo Sebelum"
                value={transaction.balanceBefore}
              />

              <BalanceItem
                label="Saldo Setelah"
                value={transaction.balanceAfter}
              />
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
          <span className="text-sm text-gray-500">Status</span>

          <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 size={17} />
            {transaction.status}
          </div>
        </div>

        {/* Kembali */}
        <div className="border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 active:scale-[0.98]"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionSourceDetail({ detail, modul }) {
  if (!detail) return null;

  const items =
    modul === "sales"
      ? detail.sales?.map((item) => ({
          name: item.product?.name,
          quantity: item.quantity,
          price: item.priceSell,
          total: item.total,
        }))
      : modul === "operational"
        ? detail.opsdetail?.map((item) => ({
            name: item.name,
            quantity: item.qty,
            price: item.price,
            total: item.totalPrice,
          }))
        : modul === "restock"
          ? detail.restockDetail?.map((item) => ({
              name: item.name,
              quantity: item.qty,
              price: item.qty ? Number(item.price) / item.qty : 0,
              total: item.price,
            }))
          : [];

  if (!items?.length) return null;

  return (
    <div className="border-t border-gray-100 px-5 py-4">
      <p className="mb-3 text-sm font-semibold text-gray-900">
        Rincian {modul === "sales" ? "Penjualan" : "Pembelian"}
      </p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="rounded-xl border border-gray-100 bg-gray-50 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 break-words text-sm font-medium text-gray-900">
                {item.name || "-"}
              </p>
              <p className="shrink-0 text-sm font-semibold text-gray-900">
                {formatDetailCurrency(item.total)}
              </p>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {item.quantity ?? 0} x {formatDetailCurrency(item.price)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDetailCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
        <Icon size={17} className="text-gray-500" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>

        <p className="mt-0.5 break-words text-sm font-medium text-gray-900">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function BalanceItem({ label, value }) {
  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);

  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>

      <p className="mt-1 text-sm font-semibold text-gray-900">
        {formatCurrency(value)}
      </p>
    </div>
  );
}
