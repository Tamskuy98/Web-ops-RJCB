import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import Alert from "../components/Alert";
import LoadingSpinner from "../components/LoadingSpinner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function UserManagementPage() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, all
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Redirect if not admin
  if (user && user.role !== "admin") {
    return (
      <div className="p-6">
        <Alert
          type="error"
          message="You don't have permission to access this page. Admin access required."
        />
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to fetch users. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = users;

    if (filter !== "all") {
      filtered = users.filter((u) => u.status === filter);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredUsers(filtered);
  };

  const handleApprove = async (userId) => {
    try {
      setActionInProgress(true);
      setError("");
      const response = await axios.post(
        `${API_URL}/api/auth/users/${userId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess("User approved successfully! Confirmation email sent.");
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to approve user. Please try again.",
      );
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async (userId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    try {
      setActionInProgress(true);
      setError("");
      const response = await axios.post(
        `${API_URL}/api/auth/users/${userId}/reject`,
        { reason: rejectionReason },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess("User rejected. Notification email sent.");
      fetchUsers();
      setSelectedUser(null);
      setRejectionReason("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reject user. Please try again.",
      );
    } finally {
      setActionInProgress(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const icons = {
      pending: <Clock className="w-4 h-4 inline mr-1" />,
      approved: <Check className="w-4 h-4 inline mr-1" />,
      rejected: <X className="w-4 h-4 inline mr-1" />,
    };

    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">
          Approve or reject pending user registrations
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert type="success" message={success} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Check className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.status === "approved").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <X className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-gray-600 text-sm">Rejected</p>
              <p className="text-2xl font-bold">
                {users.filter((u) => u.status === "rejected").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["pending", "approved", "rejected", "all"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No users found with status: {filter}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((usr) => (
                  <tr
                    key={usr.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{usr.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{usr.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600 capitalize">
                        {usr.branch || "Head Office"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {statusBadge(usr.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">
                        {formatDate(usr.createdAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {usr.status === "pending" ? (
                        <button
                          onClick={() => setSelectedUser(usr)}
                          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Review Registration
            </h2>

            {/* User Info */}
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">
                  {selectedUser.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium text-gray-900 capitalize">
                  {selectedUser.role}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Branch</p>
                <p className="font-medium text-gray-900 capitalize">
                  {selectedUser.branch || "Head Office"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Date</p>
                <p className="font-medium text-gray-900">
                  {formatDate(selectedUser.createdAt)}
                </p>
              </div>
            </div>

            {/* Rejection Reason Input (for reject action) */}
            {selectedUser.status === "pending" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Explain why you're rejecting this request..."
                  rows="3"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {selectedUser.status === "pending" && (
                <>
                  <button
                    onClick={() => handleApprove(selectedUser.id)}
                    disabled={actionInProgress}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {actionInProgress ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(selectedUser.id)}
                    disabled={actionInProgress || !rejectionReason.trim()}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {actionInProgress ? "Processing..." : "Reject"}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setRejectionReason("");
                }}
                className="flex-1 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
