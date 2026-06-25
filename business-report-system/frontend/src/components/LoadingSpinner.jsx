export default function LoadingSpinner({ size = "md" }) {
  const sizes = { sm: "h-6 w-6", md: "h-10 w-10", lg: "h-16 w-16" };
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`animate-spin rounded-full border-b-2 border-red-600 ${sizes[size]}`}
      ></div>
    </div>
  );
}
