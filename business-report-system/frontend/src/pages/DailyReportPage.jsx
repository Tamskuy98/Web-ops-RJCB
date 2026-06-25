import { useState, useEffect } from "react";
import api from "../services/api";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import "./DailyReportPage.css";

export default function DailyReportPage() {
  // Form state
  const [form, setForm] = useState({
    productId: "",
    quantity: 1,
    priceSell: 0,
    qris: 0,
    expenses: [],
  });

  // UI state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [apiError, setApiError] = useState("");

  // Calculations
  const [calculations, setCalculations] = useState({
    totalRevenue: 0,
    totalPengeluaran: 0,
    totalFinal: 0,
    totalSetoran: 0,
  });

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data.data);
      } catch (error) {
        setApiError("Failed to load products. Please refresh the page.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Auto-calculate totals whenever form changes
  useEffect(() => {
    calculateTotals();
  }, [form]);

  /**
   * Calculate all totals based on current form state
   */
  const calculateTotals = () => {
    const revenue = form.priceSell * form.quantity;
    const expenses = form.expenses.reduce((sum, exp) => sum + exp.total, 0);
    const final = revenue - expenses;
    const setoran = final - form.qris;

    setCalculations({
      totalRevenue: revenue,
      totalPengeluaran: expenses,
      totalFinal: final,
      totalSetoran: setoran,
    });
  };

  /**
   * Handle product selection - auto-populate price
   */
  const handleProductChange = (e) => {
    const productId = Number(e.target.value);
    const product = products.find((p) => p.id === productId);

    if (product) {
      setForm({
        ...form,
        productId,
        priceSell: product.priceSell,
      });
    }
  };

  /**
   * Handle main form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "quantity" || name === "qris" ? Number(value) : value,
    });
  };

  /**
   * Add new expense row
   */
  const addExpense = () => {
    setForm({
      ...form,
      expenses: [
        ...form.expenses,
        {
          namaBarang: "",
          qty: 1,
          harga: 0,
          total: 0,
        },
      ],
    });
  };

  /**
   * Update expense row
   */
  const handleExpenseChange = (index, field, value) => {
    const updatedExpenses = [...form.expenses];
    updatedExpenses[index][field] = isNaN(value) ? value : Number(value);

    // Auto-calculate expense total
    if (field === "qty" || field === "harga") {
      updatedExpenses[index].total =
        updatedExpenses[index].qty * updatedExpenses[index].harga;
    }

    setForm({
      ...form,
      expenses: updatedExpenses,
    });
  };

  /**
   * Remove expense row
   */
  const removeExpense = (index) => {
    setForm({
      ...form,
      expenses: form.expenses.filter((_, i) => i !== index),
    });
  };

  /**
   * Handle form submission - opens PIN modal
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPin("");
    setPinError("");
    setShowPinModal(true);
  };

  /**
   * Validate PIN and submit report
   */
  const handlePinSubmit = async (e) => {
    e.preventDefault();

    if (!pin.trim()) {
      setPinError("PIN is required");
      return;
    }

    setSubmitting(true);
    setPinError("");

    try {
      const payload = {
        productId: form.productId,
        quantity: form.quantity,
        priceSell: form.priceSell,
        qris: form.qris,
        expenses: form.expenses.length > 0 ? form.expenses : undefined,
        pin,
      };

      const res = await api.post("/daily-report", payload);

      // Show success modal with WhatsApp message
      setWhatsappMessage(res.data.data.whatsappMessage);
      setShowPinModal(false);
      setShowSuccessModal(true);

      // Reset form
      setForm({
        productId: "",
        quantity: 1,
        priceSell: 0,
        qris: 0,
        expenses: [],
      });
      setPin("");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.data?.[0]?.message ||
        "Failed to save report. Please try again.";
      setPinError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Copy WhatsApp message to clipboard
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      alert("Message copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  /**
   * Open WhatsApp with pre-filled message
   */
  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    // Opens WhatsApp Web - adjust for mobile if needed
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ðŸ“‹ Laporan Harian
          </h1>
          <p className="text-gray-600">
            Input laporan penjualan harian tanpa login
          </p>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {apiError}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ðŸ“¦ Produk *
              </label>
              <select
                value={form.productId}
                onChange={handleProductChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                required
              >
                <option value="">Pilih Produk</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.category}) - Stok: {product.stock}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ðŸ“Š Jumlah Terjual *
              </label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={form.quantity}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                required
              />
            </div>

            {/* Price Per Item */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ðŸ’µ Harga Jual (per item) *
              </label>
              <input
                type="number"
                name="priceSell"
                min="0"
                step="100"
                value={form.priceSell}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                required
              />
            </div>

            {/* QRIS */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ðŸ“± QRIS (Opsional)
              </label>
              <input
                type="number"
                name="qris"
                min="0"
                step="100"
                value={form.qris}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Expenses Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                ðŸ“¤ Pengeluaran (Opsional)
              </h3>
              <button
                type="button"
                onClick={addExpense}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
              >
                + Tambah
              </button>
            </div>

            {form.expenses.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                Tidak ada pengeluaran ditambahkan
              </p>
            ) : (
              <div className="space-y-3">
                {form.expenses.map((expense, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end bg-white p-3 rounded"
                  >
                    {/* Nama Barang */}
                    <input
                      type="text"
                      placeholder="Nama barang"
                      value={expense.namaBarang}
                      onChange={(e) =>
                        handleExpenseChange(index, "namaBarang", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    />

                    {/* Qty */}
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={expense.qty}
                      onChange={(e) =>
                        handleExpenseChange(index, "qty", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    />

                    {/* Harga */}
                    <input
                      type="number"
                      placeholder="Harga"
                      min="0"
                      step="100"
                      value={expense.harga}
                      onChange={(e) =>
                        handleExpenseChange(index, "harga", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                    />

                    {/* Total (auto) */}
                    <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
                      {formatCurrency(expense.total)}
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => removeExpense(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
                    >
                      ðŸ—‘ï¸ Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calculations Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-red-50 rounded-lg mb-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Pendapatan</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(calculations.totalRevenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Pengeluaran</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(calculations.totalPengeluaran)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total Bersih</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(calculations.totalFinal)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Setor (Cash)</p>
              <p className="text-xl font-bold text-indigo-600">
                {formatCurrency(calculations.totalSetoran)}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-lg transition shadow-lg"
            >
              âœ… Simpan & Kirim WA
            </button>
          </div>
        </form>
      </div>

      {/* PIN Validation Modal */}
      <Modal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        title="ðŸ” Verifikasi PIN"
      >
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Masukkan PIN Admin
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
              autoFocus
            />
            {pinError && (
              <p className="text-red-600 text-sm mt-2">{pinError}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPinModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {submitting ? "Memproses..." : "Kirim"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Success Modal with WhatsApp Message */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="âœ… Laporan Tersimpan"
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
            <p className="text-green-800 font-semibold">
              Laporan harian Anda telah berhasil tersimpan!
            </p>
          </div>

          {/* WhatsApp Message Preview */}
          <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
            <p className="text-xs text-gray-600 mb-2 font-semibold">
              PESAN WHATSAPP:
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {whatsappMessage}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              ðŸ“‹ Copy Pesan
            </button>
            <button
              onClick={openWhatsApp}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              ðŸ’¬ Buka WhatsApp
            </button>
          </div>

          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Tutup
          </button>
        </div>
      </Modal>
    </div>
  );
}
