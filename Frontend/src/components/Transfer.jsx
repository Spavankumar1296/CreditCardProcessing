import React, { useState, useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { idAtom, toUserAtom } from "../store/atoms/atoms";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function Transfer() {
  const navigate = useNavigate();

  // Recoil atoms
  const recoilToId = useRecoilValue(idAtom);
  const recoilToUser = useRecoilValue(toUserAtom);
  const setToId = useSetRecoilState(idAtom);
  const setToUser = useSetRecoilState(toUserAtom);

  // Local states
  const [to, setTo] = useState(recoilToId ?? "");
  const [toDisplay, setToDisplay] = useState(recoilToUser ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  // Prefill if user was preselected
  useEffect(() => {
    if (recoilToId) setTo(recoilToId);
    if (recoilToUser) setToDisplay(recoilToUser);
  }, [recoilToId, recoilToUser]);

  // helper to get auth header
  const getAuthHeaderObj = () => {
    const token = localStorage.getItem("token") || "";
    const bearer = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return {
      headers: {
        Authorization: bearer,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch all users (with search)
  async function fetchUsers() {
    try {
      const token = localStorage.getItem("token");
      // console.log("token : ", token);
      const res = await axios.post(
        "http://localhost:3000/api/v1/user/bulk",
        {
          auth: token,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed fetching users:", err);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // Basic validation
  const validate = () => {
    if (!to || to.trim().length === 0)
      return "Enter recipient ID before sending.";
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) return "Enter valid amount (> 0).";
    return null;
  };

  const openConfirm = () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setConfirmOpen(true);
  };

  const doTransfer = async () => {
    setConfirmOpen(false);
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.post(
        "http://localhost:3000/api/v1/Account/transaction",
        {
          to: to,
          amount: Math.floor(parseFloat(amount)),
          note: note?.trim() || undefined,
        },
        {
          headers: {
            "content-type": "application/json",
            authorization: token,
          },
        }
      );

      setSuccess(res?.data?.msg ?? "Transfer successful.");
      
      // Store the transfer details in Recoil
      setToId(to);
      setToUser(toDisplay || to);

      // Clear the form
      setAmount("");
      setNote("");
      
      // IMPORTANT: Clear any cached transaction data
      // This ensures ViewTransactions will fetch fresh data
      sessionStorage.removeItem('cachedTransactions');
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate("/dashboard");
        setTimeout(() => navigate(0), 50);
      }, 1500);
    } catch (err) {
      console.error("Transfer error:", err);
      const msg =
        err?.response?.data?.msg ||
        err?.response?.data?.message ||
        "Transfer failed. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection from right panel
  const handleSelectUser = (user) => {
    setTo(user.id);
    setToDisplay(user.Username);
    setToId(user.id);
    setToUser(user.Username);
  };

  // Handle search input
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    fetchUsers(q);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-gray-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                    Transfer Money
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">Send money securely to any user</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all backdrop-blur-sm flex items-center gap-2 group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Transfer Form */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Send Money</h2>
            </div>

            <div className="space-y-5">
              {/* Recipient ID */}
              <label className="block">
                <div className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Recipient ID
                </div>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Enter recipient ID"
                  className="w-full rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 placeholder-gray-500 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-all backdrop-blur-sm"
                />
                {toDisplay && (
                  <div className="mt-2 text-sm text-green-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Sending to: {toDisplay}
                  </div>
                )}
              </label>

              {/* Amount */}
              <label className="block">
                <div className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Amount (₹)
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                  <input
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="e.g., 500"
                    className="w-full rounded-xl bg-slate-900/50 border border-white/10 pl-8 pr-4 py-3 placeholder-gray-500 text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none transition-all backdrop-blur-sm"
                  />
                </div>
              </label>

              {/* Note */}
              <label className="block">
                <div className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Note (optional)
                </div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="For rent / gift / etc."
                  className="w-full rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 placeholder-gray-500 text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:outline-none transition-all backdrop-blur-sm"
                />
              </label>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={openConfirm}
                disabled={loading}
                className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span>Initiate Transfer</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setTo("");
                  setAmount("");
                  setNote("");
                  setSuccess(null);
                  setError(null);
                }}
                className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-100 font-medium transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* RIGHT: User List */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">All Users</h2>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search by name..."
                  className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-all backdrop-blur-sm w-full sm:w-56"
                />
              </div>
            </div>

            <div className="max-h-[32rem] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
              {users.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="text-gray-400 text-sm">No users found...</div>
                </div>
              )}

              {users.map((user) => (
                <div
                  key={user.id}
                  className="group flex items-center justify-between bg-slate-900/50 border border-white/10 hover:border-indigo-500/50 rounded-xl p-4 hover:bg-slate-900/70 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user.Username ? user.Username[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                        {user.Username}
                      </div>
                      <div className="text-sm text-gray-400">{user.id}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectUser(user)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium transition-all shadow-md hover:shadow-lg group-hover:scale-105"
                  >
                    Send Money
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative z-10 max-w-md w-full backdrop-blur-2xl bg-gradient-to-br from-slate-900/95 to-indigo-900/95 border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-white text-center mb-2">Confirm Transfer</h3>
            <p className="text-center text-gray-400 mb-6">Please review the details before proceeding</p>

            {/* Transfer Details */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className="text-2xl font-bold text-green-400">₹{amount}</span>
              </div>
              <div className="border-t border-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Recipient</span>
                <span className="font-semibold text-gray-100">{toDisplay || to}</span>
              </div>
              {note && (
                <>
                  <div className="border-t border-white/10"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Note</span>
                    <span className="text-gray-300 text-sm">{note}</span>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={doTransfer}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold transition-all shadow-lg hover:shadow-red-500/50"
                disabled={loading}
              >
                {loading ? "Sending..." : "Yes, send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}