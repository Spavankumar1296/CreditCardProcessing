// src/components/Home.jsx
import React, { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { usernameAtom, idAtom } from "../store/atoms/atoms";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/**
 * Home.jsx — Enhanced UI with ALL original logic preserved
 * - All navigation routes intact
 * - All state management preserved
 * - All functions unchanged
 * - Only UI/styling enhanced
 */

function decodeTokenForUserId(token) {
  if (!token) return null;
  try {
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const payload = raw.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.userId || decoded.userID || decoded.sub || decoded.id || null;
  } catch {
    return null;
  }
}

export default function Home() {
  const username = useRecoilValue(usernameAtom);
  const recoilUserId = useRecoilValue(idAtom);
  const navigate = useNavigate();

  const [currentUserId, setCurrentUserId] = useState(recoilUserId || null);

  const [balance, setBalance] = useState(null);
  const [isBalanceOpen, setIsBalanceOpen] = useState(false);

  // transaction modal state
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState(null);

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

  // Fetch balance
  async function fetchBalance() {
    try {
      const res = await axios.get(
        "http://localhost:3000/api/v1/Account/balance",
        getAuthHeaderObj()
      );
      setBalance(res.data.balance ?? res.data);
    } catch (err) {
      console.error("Failed fetching balance:", err);
      setBalance("—");
    }
  }

  useEffect(() => {
    // set current user id from recoil if available, otherwise decode token
    if (recoilUserId) setCurrentUserId(recoilUserId);
    else {
      const token = localStorage.getItem("token") || "";
      const idFromToken = decodeTokenForUserId(token);
      if (idFromToken) setCurrentUserId(idFromToken);
    }

    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoilUserId]);

  // Open balance modal and refresh balance
  const openBalance = async () => {
    setIsBalanceOpen(true);
    await fetchBalance();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-gray-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                    Payments App
                  </div>
                  <div className="text-sm text-indigo-300/70">Secure & Fast Transfers</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="text-sm text-gray-400">Welcome,</div>
                  <div className="font-semibold text-lg">{username || "User"}</div>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg ring-2 ring-white/20">
                  {username ? username[0].toUpperCase() : "U"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Balance Display */}
          <div className="mt-8 backdrop-blur-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-400/30 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-sm font-medium text-indigo-300 uppercase tracking-wider">Current Balance</div>
                <div className="text-4xl font-bold text-white mt-2">
                  {balance === null ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <span className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                      ₹{typeof balance === 'number' ? balance.toLocaleString('en-IN') : balance}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={openBalance}
                className="group px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm flex items-center gap-2"
              >
                <span className="text-white font-medium">View Details</span>
                <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* View Balance Card */}
            <button
              onClick={openBalance}
              className="group relative overflow-hidden backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/50 transition-shadow">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">View Balance</h3>
                <p className="mt-2 text-sm text-gray-400">See your current account balance.</p>
                <div className="mt-4 flex items-center text-indigo-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <span>Quick view</span>
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Send Money Card */}
            <button
              onClick={() => navigate("/Transfer")}
              className="group relative overflow-hidden backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-400/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-green-500/50 transition-shadow">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Send Money</h3>
                <p className="mt-2 text-sm text-gray-400">Transfer funds to friends and family.</p>
                <div className="mt-4 flex items-center text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <span>Fast</span>
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Manage Account Card */}
            <button
              onClick={() => navigate("/account")}
              className="group relative overflow-hidden backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:to-orange-500/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-amber-500/50 transition-shadow">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Manage Account</h3>
                <p className="mt-2 text-sm text-gray-400">Update personal info, security & settings.</p>
                <div className="mt-4 flex items-center text-amber-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <span>Settings</span>
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Transaction History Card */}
            <button
              onClick={() => navigate("/viewTransactions")}
              className="group relative overflow-hidden backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-400/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-500/0 group-hover:from-pink-500/10 group-hover:to-rose-500/10 transition-all duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg group-hover:shadow-pink-500/50 transition-shadow">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Transaction History</h3>
                <p className="mt-2 text-sm text-gray-400">View recent transfers with other users.</p>
                <div className="mt-4 flex items-center text-pink-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  <span>Recent</span>
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Balance Modal */}
      {isBalanceOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
            onClick={() => setIsBalanceOpen(false)} 
          />
          <div className="relative z-50 max-w-lg w-full backdrop-blur-2xl bg-gradient-to-br from-slate-900/95 to-indigo-900/95 border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-2xl font-bold text-white">Your Balance</h4>
                <p className="text-sm text-gray-400 mt-1">Available balance</p>
              </div>
              <button 
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all" 
                onClick={() => setIsBalanceOpen(false)} 
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Balance Display */}
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-400/30 rounded-2xl p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-indigo-300 font-medium">Available balance</div>
                  <div className="text-xs text-indigo-400/70">As of now</div>
                </div>
              </div>
              
              <div className="text-5xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                {balance === null ? "Loading..." : `₹${balance}`}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all font-medium text-white flex items-center justify-center gap-2 group"
                onClick={() => fetchBalance()}
              >
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button 
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all font-medium text-white shadow-lg hover:shadow-xl" 
                onClick={() => setIsBalanceOpen(false)}
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