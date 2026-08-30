import { CheckCircle2 } from "lucide-react";

export default function TransactionRecord({ transaction, onClick }) {
  const isIncome = transaction.type === "IN";

  const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(value);

  return (
    <button
      type="button"
      onClick={() => onClick(transaction)}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-left transition hover:bg-gray-50 active:scale-[0.99]"
    >
      {/* <div className="flex items-center justify-between">
        Nominal
        <div className="flex items-center gap-3">
          <span
            className={`text-2xl font-bold ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            {isIncome ? "+" : "-"}
          </span>

          <div>
            <p
              className={`text-xl font-semibold ${
                isIncome ? "text-green-600" : "text-red-600"
              }`}
            >
              Rp {formatNumber(transaction.amount)}
            </p>
          </div>
        </div>

        Date
        <div className="flex items-center">
          <p className="text-xs text-gray-400">
            {new Date(transaction.date).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
            {" · "}
            {new Date(transaction.date).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        Status
        {transaction.status === "SUCCESS" && (
          <CheckCircle2 size={20} className="text-green-500" />
        )}
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-500">
          {transaction.modul} - {transaction.BalanceType} - {transaction.type}
        </p>
      </div> */}

      <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
        <div className="flex items-center justify-center col-span-1">
          <span
            className={`text-2xl font-bold ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            {isIncome ? "+" : "-"}
          </span>
        </div>
        <div className="flex flex-col col-span-2 md:col-span-9 gap-1">
          <p
            className={`text-xl font-semibold ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            Rp {formatNumber(transaction.amount)}
          </p>
          <p className="text-sm text-gray-500">{transaction.modul}</p>
        </div>
        <div className="flex items-center justify-center md:justify-end col-span-3 md:col-span-2 col-start-4">
          <p className="text-center text-xs text-gray-400">
            {new Date(transaction.date).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
            {" · "}
            {new Date(transaction.date).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </button>
  );
}
