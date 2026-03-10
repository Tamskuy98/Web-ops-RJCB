import { useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/helpers';

export default function ProfitSharePage() {
  const [ownerPct, setOwnerPct] = useState(60);
  const [partnerPct, setPartnerPct] = useState(40);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = () => {
    if (Number(ownerPct) + Number(partnerPct) !== 100) {
      alert('Owner % + Partner % must equal 100%');
      return;
    }
    setLoading(true);
    api.get('/report/revenue-share', {
      params: { ownerPercentage: ownerPct, partnerPercentage: partnerPct, startDate, endDate },
    })
      .then((res) => setResult(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profit Share</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner %</label>
            <input type="number" min="0" max="100" value={ownerPct}
              onChange={(e) => { setOwnerPct(e.target.value); setPartnerPct(100 - Number(e.target.value)); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Partner %</label>
            <input type="number" min="0" max="100" value={partnerPct}
              onChange={(e) => { setPartnerPct(e.target.value); setOwnerPct(100 - Number(e.target.value)); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <button onClick={calculate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Calculate
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {result && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-500">Total Profit</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(result.totalProfit)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-center text-white">
            <p className="text-sm text-blue-100">Owner Share ({result.ownerPercentage}%)</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(result.ownerShare)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-center text-white">
            <p className="text-sm text-purple-100">Partner Share ({result.partnerPercentage}%)</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(result.partnerShare)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
