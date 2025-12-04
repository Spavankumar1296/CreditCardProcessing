// src/components/ViewTransactions.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useRecoilValue } from "recoil";
import { idAtom, SigninUserDataAtom, usernameAtom } from "../store/atoms/atoms";
import { useNavigate } from "react-router-dom";

/** Lightweight token payload decoder to fallback to userId */
function safeDecodeTokenGetUserId(token) {
  if (!token) return null;
  try {
    const raw = token.split(" ")[1] || token;
    const payload = raw.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.userId || decoded.userID || decoded.sub || decoded.id || null;
  } catch {
    return null;
  }
}

export default function ViewTransactions() {
  const navigate = useNavigate();
  const recoilId = useRecoilValue(idAtom);
  const signinUser = useRecoilValue(SigninUserDataAtom);
  const username = useRecoilValue(usernameAtom);

  const [userId, setUserId] = useState(() => recoilId || signinUser?.id || signinUser?._id || null);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (recoilId) {
      setUserId(recoilId);
      return;
    }
    if (signinUser?.id || signinUser?._id) {
      setUserId(signinUser.id ?? signinUser._id);
      return;
    }
    const token = localStorage.getItem("token") || "";
    const idFromToken = safeDecodeTokenGetUserId(token);
    if (idFromToken) setUserId(idFromToken);
  }, [recoilId, signinUser]);

  const authHeaders = () => {
    const token = localStorage.getItem("token") || "";
    const bearer = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return {
      headers: {
        Authorization: bearer,
        "Content-Type": "application/json",
        // IMPORTANT: Add cache control headers
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    };
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchTx() {
      setError(null);
      setLoading(true);

      try {
        // IMPORTANT: Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/v1/Account/transactions?t=${timestamp}`,
          authHeaders()
        );

        if (cancelled) return;

        const raw = Array.isArray(res.data)
          ? res.data
          : (res.data && Array.isArray(res.data.transactions))
            ? res.data.transactions
            : [];

        const normalized = raw.map((t) => {
          const senderId =
            t.senderId ??
            t.sender ??
            t.fromId ??
            t.from ??
            t.SenderId ??
            t.Sender ??
            t.userFrom ??
            null;

          const receiverId =
            t.receiverId ??
            t.receiver ??
            t.RecevierId ??
            t.toId ??
            t.to ??
            t.ReceiverId ??
            t.userTo ??
            null;

          const amount = Number(t.amount ?? t.Amount ?? t.Amt ?? 0);
          const note = t.note ?? t.Note ?? "";
          const createdAt = t.createdAt ?? t.created_at ?? t.timestamp ?? t.time ?? null;
          const senderName =
            t.senderName ??
            t.fromName ??
            (t.senderUser && (t.senderUser.FirstName || t.senderUser.username)) ??
            "";
          const receiverName =
            t.receiverName ??
            t.toName ??
            (t.receiverUser && (t.receiverUser.FirstName || t.receiverUser.username)) ??
            "";

          return {
            id: t._id ?? t.id ?? `${senderId || ""}-${receiverId || ""}-${Math.random()}`,
            senderId,
            receiverId,
            senderName,
            receiverName,
            amount,
            note,
            createdAt,
            raw: t,
          };
        });

        // Sort newest-first
        normalized.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });

        setTransactions(normalized);
      } catch (err) {
        console.error("Failed fetching transactions:", err);
        setError(err?.response?.data?.message ?? err?.message ?? "Failed to load transactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTx();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]); // Only depends on refreshKey

  const filteredTx = useMemo(() => {
    if (!userId) return transactions;
    if (filter === "all") return transactions;
    if (filter === "sent") return transactions.filter((t) => String(t.senderId) === String(userId));
    if (filter === "received") return transactions.filter((t) => String(t.receiverId) === String(userId));
    return transactions;
  }, [transactions, filter, userId]);

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  };

  // Rest of your JSX remains the same...

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-gray-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
                    Transaction History
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">All sent and received transactions</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-gray-100 font-medium transition-all flex items-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters and Content */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-6">
            {/* Filter Pills & Count */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${filter === "all"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    All
                  </span>
                </button>
                <button
                  onClick={() => setFilter("sent")}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${filter === "sent"
                      ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    Sent
                  </span>
                </button>
                <button
                  onClick={() => setFilter("received")}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${filter === "received"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Received
                  </span>
                </button>
              </div>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                <span className="text-sm text-gray-400">Showing </span>
                <span className="text-white font-bold">{filteredTx.length}</span>
                <span className="text-sm text-gray-400"> transaction(s)</span>
              </div>
            </div>

            {/* Transactions List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mb-4"></div>
                <div className="text-gray-300 font-medium">Loading transactions...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-red-400 font-medium">{error}</div>
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div className="text-gray-400 font-medium">No transactions to show.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTx.map((t) => {
                  // determine direction strictly by comparing IDs
                  let direction = "unknown";
                  if (userId && String(t.senderId) === String(userId)) direction = "sent";
                  else if (userId && String(t.receiverId) === String(userId)) direction = "received";

                  const counterpartyName = direction === "sent" ? (t.receiverName || t.receiverId) : (t.senderName || t.senderId);
                  // console.log("counter party name :", counterpartyName);

                  return (
                    <div
                      key={t.id}
                      className="group backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-xl p-5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Icon + Details */}
                        <div className="flex items-start gap-4 flex-1">
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${direction === "sent"
                              ? "bg-gradient-to-br from-red-500 to-red-600"
                              : direction === "received"
                                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                                : "bg-gradient-to-br from-gray-500 to-gray-600"
                            }`}>
                            {direction === "sent" ? (
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                            ) : direction === "received" ? (
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            )}
                          </div>

                          {/* Transaction Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-base text-gray-300 mb-1">
                              {direction === "sent" ? (
                                <>
                                  <span className="text-gray-400">Sent </span>
                                  <span className="font-bold text-white">₹{t.amount.toLocaleString('en-IN')}</span>
                                  <span className="text-gray-400"> to </span>
                                  <span className="font-semibold text-indigo-300">{counterpartyName}</span>
                                </>
                              ) : direction === "received" ? (
                                <>
                                  <span className="text-gray-400">Received </span>
                                  <span className="font-bold text-white">₹{t.amount.toLocaleString('en-IN')}</span>
                                  <span className="text-gray-400"> from </span>
                                  <span className="font-semibold text-indigo-300">{counterpartyName}</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-white">₹{t.amount.toLocaleString('en-IN')}</span>
                                  <span className="text-gray-400"> — </span>
                                  <span className="font-semibold text-indigo-300">{counterpartyName}</span>
                                </>
                              )}
                            </div>

                            {t.note && (
                              <div className="flex items-start gap-2 mt-2">
                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span className="text-xs text-gray-400 break-words">{t.note}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{formatDate(t.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Status Badge */}
                        <div className="flex flex-col items-end gap-2">
                          <div className={`px-4 py-2 rounded-lg font-semibold text-sm shadow-md ${direction === "sent"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : direction === "received"
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                            }`}>
                            {direction === "sent" ? "Sent" : direction === "received" ? "Received" : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}