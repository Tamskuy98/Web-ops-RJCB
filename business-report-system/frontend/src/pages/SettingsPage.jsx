import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-500">Name</label>
            <p className="font-medium text-gray-900">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500">Email</label>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500">Role</label>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Application Info</h3>
        <p className="text-sm text-gray-500">BizReport - Business Report & Stock Management System</p>
        <p className="text-sm text-gray-500">Version 1.0.0</p>
      </div>
    </div>
  );
}
