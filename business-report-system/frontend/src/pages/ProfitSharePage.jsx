import { useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency } from "../utils/helpers";

export default function ProfitSharePage() {
  const [ownerPct, setOwnerPct] = useState(30);
  const [plkuPct, setplkuPct] = useState(30);
  const [pmatPct, setpmatPct] = useState(20);
  const [pmahPct, setpmahPct] = useState(20);

  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = () => {
    if (
      Number(ownerPct) + Number(plkuPct) + Number(pmatPct) + Number(pmahPct) !==
      100
    ) {
      alert("Total pembagian harus 100%");
      return;
    }

    setLoading(true);
    api
      .get("/report/revenue-share", {
        params: {
          ownerPercentage: ownerPct,
          pelakuusahaPercentage: plkuPct,
          pemilikasettetapPercentage: pmatPct,
          pemilikasetmahalPercentage: pmahPct,
          startDate,
          endDate,
        },
      })
      .then((res) => setResult(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profit Share</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 items-end">
          {/* owner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={ownerPct}
              readOnly
              onChange={(e) => setOwnerPct(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>

          {/* pelakuusaha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pelaku usaha %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={plkuPct}
              readOnly
              onChange={(e) => setplkuPct(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>

          {/* Pemilik aset tetap */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pemilik aset tetap %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={pmatPct}
              readOnly
              onChange={(e) => setpmatPct(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>

          {/* Pemilik aset mahal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pemilik aset mahal %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={pmahPct}
              readOnly
              onChange={(e) => setpmahPct(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>

          {/* startdate endate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="w-full pt-4">
          <button
            onClick={calculate}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Calculate
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {result && !loading && (
        <div>
          <div className="w-full pb-3 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-5 text-center">
                <p className="text-sm text-gray-500">Total Profit</p>
                <p className="text-xl font-bold">
                  {formatCurrency(result.totalProfit)}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Total laba dari penjualan sebelum dikurangi biaya pengeluaran
                </p>
              </div>
              <div className="bg-white relative overflow-hidden rounded-xl border border-red-400 p-5 text-center">
                <p className="text-sm font-medium text-gray-500">
                  Total Saldo (Cash Flow)
                </p>
                <p className="text-xl font-bold tracking-tight text-gray-900">
                  {formatCurrency(result.totalCashflow)}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Total saldo (Cash flow) sebagai rujukan perhitungan pembagian
                  hasil
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-5 text-center">
                <p className="text-sm text-gray-500">
                  Saldo Cash (Sudah Disetor)
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(result.cashflowSudahDisetor)}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Total saldo saat ini (cashflow) dari penjualan yang telah
                  disetor ke owner
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-5 text-center">
                <p className="text-sm text-gray-500">QRIS</p>
                <p className="text-xl font-bold">
                  {formatCurrency(result.cashflowQris)}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Total uang masuk (cashflow) melalui QRIS dari penjualan
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-5 text-center">
                <p className="text-sm text-gray-500">
                  Saldo Cash (Belum Disetor)
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(result.cashflowBelumDisetor)}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Total saldo saat ini (cashflow) dari penjualan yang belum
                  disetor ke owner
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-5 text-center">
                <p className="text-sm text-gray-500">Biaya Operasional</p>
                <p className="text-xl font-bold">
                  {formatCurrency(result.biayaOperasional)}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Total uang keluar untuk biaya operasional
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-5 text-center">
                <p className="text-sm text-gray-500">Biaya Restock</p>
                <p className="text-xl font-bold">
                  {formatCurrency(result.biayaRestock)}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Total uang keluar untuk biaya restock
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-5 text-center">
                <p className="text-sm text-gray-500">Total Hutang</p>
                <p className="text-xl font-bold">
                  {formatCurrency(result.totalHutangBelumLunas)}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Total hutang yang belum dilunasi dari pengeluaran belanja
                  operasional dan restock
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-5 text-center">
                <p className="text-sm text-gray-500">Total Pengeluaran</p>
                <p className="text-xl font-bold">
                  {formatCurrency(result.totalPengeluaran)}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Total pengeluaran belanja operasional dan restock
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-center text-white">
              <p>Owner ({result.ownerPercentage}%)</p>
              <p className="text-2xl font-bold">
                {formatCurrency(result.ownerShare)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-center text-white">
              <p>Pelaku Usaha ({result.pelakuusahaPercentage}%)</p>
              <p className="text-2xl font-bold">
                {formatCurrency(result.pelakuusahaShare)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-center text-white">
              <p>Pemilik Aset Tetap ({result.pemilikasettetapPercentage}%)</p>
              <p className="text-2xl font-bold">
                {formatCurrency(result.pemilikasettetapShare)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-center text-white">
              <p>Pemilik Aset Mahal ({result.pemilikasetmahalPercentage}%)</p>
              <p className="text-2xl font-bold">
                {formatCurrency(result.pemilikasetmahalShare)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
