import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Reusable responsive DataTable component
 * Features:
 * - Mobile: Card layout (stacked)
 * - Tablet: Horizontal scroll with sticky first column
 * - Desktop: Full table layout
 * - Consistent color scheme using existing theme
 */
export default function DataTable({
  columns = [],
  data = [],
  rowKey = "id",
  renderRow = null,
  renderMobileCard = null,
  onAction = null,
  loading = false,
  pagination = null,
  onPaginationChange = null,
  className = "",
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin border-4 border-gray-200 border-b-red-600 rounded-full w-8 h-8" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500">Belum ada data</p>
      </div>
    );
  }

  // ============ MOBILE LAYOUT (< 640px) ============
  // Show as cards/stacked layout
  const MobileView = () => (
    <div className="space-y-3">
      {data.map((row) => (
        <div
          key={row[rowKey]}
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
        >
          {renderMobileCard ? (
            renderMobileCard(row, onAction)
          ) : (
            // Default card layout
            <div className="space-y-2">
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex justify-between text-sm gap-2"
                >
                  <span className="font-medium text-gray-600">
                    {col.label}:
                  </span>
                  <span className="text-gray-900 text-right flex-1">
                    {typeof col.render === "function"
                      ? col.render(row[col.key], row)
                      : row[col.key]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ============ DESKTOP/TABLET LAYOUT (≥ 640px) ============
  // Show as table
  const DesktopView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-medium text-gray-600 ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row[rowKey]}
                className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={`${row[rowKey]}-${col.key}`}
                    className={`py-3 px-4 text-gray-700 ${
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                          ? "text-right"
                          : "text-left"
                    }`}
                  >
                    {typeof col.render === "function"
                      ? col.render(row[col.key], row, onAction)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && onPaginationChange && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="text-xs text-gray-600">
            Menampilkan {(pagination.page - 1) * pagination.perPage + 1} hingga{" "}
            {Math.min(pagination.page * pagination.perPage, pagination.total)}{" "}
            dari {pagination.total} data
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onPaginationChange(Math.max(1, pagination.page - 1))
              }
              disabled={pagination.page === 1}
              className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-600 min-w-[30px] text-center">
              {pagination.page}
            </span>
            <button
              onClick={() =>
                onPaginationChange(
                  Math.min(
                    pagination.page + 1,
                    Math.ceil(pagination.total / pagination.perPage),
                  ),
                )
              }
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.perPage)
              }
              className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ============ RENDER BASED ON SCREEN SIZE ============
  return (
    <div className={className}>
      {/* Mobile view (hidden on sm and above) */}
      <div className="sm:hidden">
        <MobileView />
      </div>

      {/* Desktop view (hidden below sm) */}
      <div className="hidden sm:block">
        <DesktopView />
      </div>
    </div>
  );
}
