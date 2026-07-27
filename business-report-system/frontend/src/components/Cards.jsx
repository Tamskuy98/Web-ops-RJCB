import {
  ShoppingCart,
  Wallet,
  DollarSign,
  Banknote,
  QrCode,
  TrendingUp,
  ChartNoAxesCombined,
  ClipboardList,
  Receipt,
  BriefcaseBusiness,
} from "lucide-react";

const CARD_CONFIGS = {
  total: {
    sales: {
      title: "Total Penjualan",
      icon: ShoppingCart,
      color: "bg-green-500",
    },
    revenue: {
      title: "Total Pendapatan",
      icon: DollarSign,
      color: "bg-blue-500",
    },
    opsCost: {
      title: "Biaya Operasional",
      icon: BriefcaseBusiness,
      color: "bg-amber-500",
    },
    supplyCost: {
      title: "Biaya Supply",
      icon: ClipboardList,
      color: "bg-orange-500",
    },
  },

  saldo: {
    cashHand: {
      title: "Cash (Sudah Disetor)",
      icon: Banknote,
      color: "bg-emerald-500",
    },
    cashHold: {
      title: "Cash (Belum Disetor)",
      icon: Wallet,
      color: "bg-lime-500",
    },
    qris: {
      title: "QRIS",
      icon: QrCode,
      color: "bg-sky-500",
    },
    outstandingpay: {
      title: "Sisa Hutang",
      icon: Receipt,
      color: "bg-rose-500",
    },
  },
};

export default function Cards({ type, value, variant, className = "" }) {
  const config = CARD_CONFIGS[variant]?.[type];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={`
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-sm
        hover:shadow-md
        transition-all
        duration-200
        p-5
        ${className}
      `}
    >
      <div className="flex h-full items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-500">
            {config.title}
          </span>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </h2>
        </div>

        <div
          className={`
            ${config.color}
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            shadow-sm
          `}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </div>
  );
}
