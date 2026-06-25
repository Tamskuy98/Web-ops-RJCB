import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  X,
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowDownToLine,
  RefreshCw,
  Warehouse,
  FileText,
  PieChart,
  Settings,
} from "lucide-react";

const allMenuItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/sales", icon: ShoppingCart, label: "Sales" },
  { to: "/incoming", icon: ArrowDownToLine, label: "Belanja Operasional" },
  { to: "/restock", icon: RefreshCw, label: "Restock" },
  { to: "/warehouse", icon: Warehouse, label: "Warehouse Stock" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/profit-share", icon: PieChart, label: "Profit Share" },
  { to: "/whatsapp-service", icon: PieChart, label: "Whatsapp Service" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const getMenuByRole = (role) => {
  if (role === "operator") {
    return allMenuItems.filter((item) =>
      ["/", "/sales", "/incoming", "/settings"].includes(item.to),
    );
  }
  if (role === "investor") {
    return allMenuItems.filter((item) =>
      ["/", "/reports", "/profit-share", "/settings"].includes(item.to),
    );
  }
  // Admin or default: show all items
  return allMenuItems;
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const menuItems = getMenuByRole(user?.role?.toLowerCase());
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">RAJACIRENGBEKASI</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-50 text-red-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
