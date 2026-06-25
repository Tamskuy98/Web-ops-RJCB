import { useState, useEffect } from "react";
import api from "../services/api";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatCurrency } from "../utils/helpers";
import QRCode from "qrcode";

export default function WhatsappServicePage() {
  const [result, setResult] = useState(false);
  const [result2, setResult2] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isActiveWhatsapp, setIsActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(null);
  const [message, setMessage] = useState("");
  const [qrImage, setQrImage] = useState(null);
  const [log, setLog] = useState("Loading ..");

  const runService = () => {
    setResult(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFailed(null);
    setMessage("");

    // setLogs((prev) => [...prev, "Starting WhatsApp service..."]);
    // setLogs((prev) => [...prev, "Service started successfully"]);
    // setLogs((prev) => [...prev, "WhatsApp is now active"]);

    try {
      const res = await axios.post("http://localhost:8082/signin", {
        username,
        password,
      });

      if (res.data.responseCode === "Successfully") {
        try {
          const start = await axios.post(
            "http://localhost:8082/start-whatsapp",
          );

          const data = start.data.success;
          console.log(data);
          setResult(false);
          setResult2(true);

          //   if (data === "true") {
          //     setResult(false);
          //     setResult2(true);

          //     console.log("masuk");
          //   } else {
          //     setFailed(true);
          //     setMessage("Failed to Start Service");
          //     setLogs((prev) => [...prev, "Failed to Start Service"]);
          //     console.log("keluar");
          //   }
        } catch (error) {
          setFailed(true);
          setMessage("Failed to Start Service");
          setLogs((prev) => [...prev, "Failed to Start Service"]);
        }
      } else {
        setFailed(true);
        setMessage(res.data.data);
      }
    } catch (err) {
      setFailed(true);
      setMessage("Failed to connect Api Service");
      setLogs((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const eventSource = new EventSource(
      "http://localhost:8082/whatsapp-events",
    );

    eventSource.addEventListener("qr", async (event) => {
      const data = JSON.parse(event.data);

      const image = await QRCode.toDataURL(data.qr);
      setQrImage(image);
      setLog("QR code generated. Please scan it with your WhatsApp.");
    });

    eventSource.addEventListener("authenticated", () => {
      setQrImage(null);
      setLog("Authenticated with WhatsApp. Service is now active.");
      setIsActive(true);
    });

    eventSource.addEventListener("ready", () => {
      setQrImage(null);
      setLog("WhatsApp service is ready and running.");
      setIsActive(true);

      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">WhatsApp Service</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
          {/* Status */}
          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>

            <input
              type="text"
              readOnly
              value={isActiveWhatsapp ? "Active" : "Inactive"}
              className={`w-full px-3 py-2 border rounded-lg text-sm text-center outline-none
        ${
          isActiveWhatsapp
            ? "border-green-500 text-green-600 bg-green-50"
            : "border-red-500 text-red-600 bg-red-50"
        }`}
            />
          </div>

          {/* Button */}
          <div className="lg:col-span-1">
            <button
              onClick={runService}
              disabled={isActiveWhatsapp}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700
    ${isActiveWhatsapp ? "cursor-not-allowed" : ""}
  `}
            >
              Run Service
            </button>
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {result && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div className="bg-red-50 rounded-xl shadow-sm p-6 text-center text-white">
            <p className="text-lg text-red-500">
              Silahkan Login Whatsapp Admin
            </p>
            <div className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-red-500"
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-red-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                {failed && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    <p>{message}</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {result2 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div className="bg-red-50 rounded-xl shadow-sm p-6 text-center text-white">
            <div className="container flex flex-col items-center justify-center">
              {qrImage && (
                <img src={qrImage} alt="WhatsApp QR" className="w-64 h-64" />
              )}

              <div>{log}</div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
