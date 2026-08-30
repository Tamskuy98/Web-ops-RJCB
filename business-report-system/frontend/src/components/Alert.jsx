import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const variants = {
  success: {
    icon: CheckCircle,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-600",
    titleColor: "text-green-800",
    textColor: "text-green-700",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-600",
    titleColor: "text-red-800",
    textColor: "text-red-700",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    iconColor: "text-yellow-600",
    titleColor: "text-yellow-800",
    textColor: "text-yellow-700",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-600",
    titleColor: "text-blue-800",
    textColor: "text-blue-700",
  },
};

export default function Alert({
  type = "info",
  title,
  message,
  show,
  duration = 3000,
  onClose,
}) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);

    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  const style = variants[type];
  const Icon = style.icon;

  return (
    <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-right duration-300">
      <div
        className={`w-96 rounded-xl border shadow-xl ${style.bg} ${style.border}`}
      >
        <div className="flex items-start gap-4 p-4">
          <Icon className={`h-6 w-6 ${style.iconColor}`} />

          <div className="flex-1">
            <h3 className={`font-semibold ${style.titleColor}`}>{title}</h3>

            <p className={`mt-1 text-sm ${style.textColor}`}>{message}</p>
          </div>

          <button
            onClick={() => {
              setVisible(false);
              onClose?.();
            }}
            className="text-gray-400 transition hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
