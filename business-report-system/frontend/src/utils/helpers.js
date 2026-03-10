export const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const getStockStatus = (stock, minStock) => {
  if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
  if (stock <= minStock) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Safe', color: 'bg-green-100 text-green-800' };
};
