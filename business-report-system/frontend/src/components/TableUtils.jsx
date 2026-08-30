/**
 * Shared building blocks for the report tables (Sales, Operational,
 * Restock, Management Debt). Keep every table page composed from these
 * pieces so spacing, colors and mobile behavior stay identical.
 */

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

// `hide` hides the cell below that breakpoint (e.g. hide="lg" => hidden until lg:)
const hideClass = (hide) => (hide ? `hidden ${hide}:table-cell` : "");

// Status / payment-type badge, shared across all tables
export function StatusBadge({ status }) {
  const baseClass =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-semibold whitespace-nowrap";

  const statusClasses = {
    // Payment / debt status
    LUNAS: `${baseClass} bg-green-100 text-green-700`,
    HUTANG: `${baseClass} bg-red-100 text-red-700`,
    SEBAGIAN: `${baseClass} bg-orange-100 text-orange-700`,
    "Sudah Disetor": `${baseClass} bg-green-100 text-green-700`,
    "Belum Disetor": `${baseClass} bg-red-100 text-red-700`,
    Pending: `${baseClass} bg-yellow-100 text-yellow-700`,
    Approved: `${baseClass} bg-green-100 text-green-700`,
    Rejected: `${baseClass} bg-red-100 text-red-700`,
    "DIBAYAR DENGAN HUTANG": `${baseClass} bg-red-100 text-red-700`,

    // Payment types
    "CASH ON HAND": `${baseClass} bg-emerald-100 text-emerald-700`,
    "CASH HOLD": `${baseClass} bg-blue-100 text-blue-700`,
    QRIS: `${baseClass} bg-yellow-100 text-yellow-700`,
    Cash: `${baseClass} bg-emerald-100 text-emerald-700`,
    "QRIS;Cash": `${baseClass} bg-purple-100 text-purple-700`,
    "Cash;QRIS": `${baseClass} bg-purple-100 text-purple-700`,
    "-": `${baseClass} bg-gray-100 text-gray-500`,
  };

  return (
    <span
      className={
        statusClasses[status] || `${baseClass} bg-gray-100 text-gray-700`
      }
    >
      {status ?? "-"}
    </span>
  );
}

// Table container: white card + horizontal scroll + shared text size
export function TableContainer({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">{children}</table>
      </div>
    </div>
  );
}

// Table head row wrapper
export function THead({ children }) {
  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>{children}</tr>
    </thead>
  );
}

// Header cell. `hide="sm"|"md"|"lg"|"xl"` progressively reveals the column.
export function Th({ children, align = "left", hide, className = "" }) {
  return (
    <th
      className={`py-2 px-2 sm:py-3 sm:px-4 font-medium text-gray-600 whitespace-nowrap ${ALIGN_CLASS[align]} ${hideClass(hide)} ${className}`}
    >
      {children}
    </th>
  );
}

// Body row with the shared hover/border treatment
export function Tr({ children, className = "" }) {
  return (
    <tr
      className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${className}`}
    >
      {children}
    </tr>
  );
}

// Body cell, mirrors Th's alignment/visibility API
export function Td({ children, align = "left", hide, className = "" }) {
  return (
    <td
      className={`py-2 px-2 sm:py-3 sm:px-4 text-gray-700 ${ALIGN_CLASS[align]} ${hideClass(hide)} ${className}`}
    >
      {children}
    </td>
  );
}

// "No data" row spanning the whole table regardless of column count
export function TableEmpty({ message = "Belum ada data" }) {
  return (
    <tr>
      <td colSpan="100%" className="py-8 text-center text-gray-400 text-sm">
        {message}
      </td>
    </tr>
  );
}

const ACTION_VARIANTS = {
  view: "hover:bg-blue-50 text-blue-600",
  edit: "hover:bg-amber-50 text-amber-600",
  delete: "hover:bg-red-50 text-red-600",
  success: "hover:bg-emerald-50 text-emerald-600",
};

// Icon action button used in the "Aksi" column across all tables
export function ActionButton({ icon: Icon, onClick, variant = "view", title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1 sm:p-1.5 rounded-lg transition-colors ${ACTION_VARIANTS[variant] || ACTION_VARIANTS.view}`}
    >
      <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
    </button>
  );
}
