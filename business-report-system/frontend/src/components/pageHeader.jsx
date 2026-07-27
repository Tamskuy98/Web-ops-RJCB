import { ChevronRight } from "lucide-react";

export default function PageHeader({
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 md:flex-row md:items-center md:justify-between ${className}`}
    >
      <div>
        <div className="mb-1 flex items-center gap-2">
          <ChevronRight className="h-5 w-5 text-red-500" />

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>
        </div>

        {description && (
          <p className="text-sm leading-relaxed text-gray-500">{description}</p>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}
