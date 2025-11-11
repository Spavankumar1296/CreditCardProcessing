// src/components/Account.jsx
import React, { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  SigninUserDataAtom,
  usernameAtom,
  idAtom,
} from "../store/atoms/atoms";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const navigate = useNavigate();

  // Recoil: signed-in user object and username
  const signinUser = useRecoilValue(SigninUserDataAtom);
  const [username, setUsername] = useRecoilState(usernameAtom);
  const setIdAtom = useSetRecoilState(idAtom);
  const setSigninUser = useSetRecoilState(SigninUserDataAtom);

  // Local form state (prefill from Recoil if available)
  const [firstName, setFirstName] = useState(signinUser?.FirstName || signinUser?.firstname || "");
  const [lastName, setLastName] = useState(signinUser?.LastName || signinUser?.lastname || "");
  const [password, setPassword] = useState("");
  const [balance, setBalance] = useState("...");

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // helper to get token header
  const authHeaders = () => {
    const token = localStorage.getItem("token") || "";
    return {
      headers: {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch balance & optionally latest profile (fallback)
  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await axios.get("http://localhost:3000/api/v1/Account/balance", authHeaders());
        if (res?.data?.balance !== undefined) setBalance(res.data.balance);
        if (res?.data?.username) {
          setUsername(res.data.username);
        }
      } catch (e) {
        console.warn("Could not fetch balance:", e?.response?.data || e.message);
        setBalance("—");
      }
    }

    async function fetchProfileIfNeeded() {
      if (!signinUser || !signinUser.email) {
        try {
          const r = await axios.get("http://localhost:3000/api/v1/user/me", authHeaders());
          const user = r.data;
          if (user) {
            setSigninUser(user);
            setUsername(user.FirstName ? `${user.FirstName} ${user.LastName || ""}` : user.username || "");
            setFirstName(user.FirstName || "");
            setLastName(user.LastName || "");
            setIdAtom(user._id || user.id || "");
          }
        } catch (err) {
          // ignore if not available
        }
      } else {
        setFirstName(signinUser.FirstName || signinUser.firstname || signinUser.email || "");
        setLastName(signinUser.LastName || signinUser.lastname || "");
      }

      
    }

    fetchBalance();
    fetchProfileIfNeeded();
    // console.log("this is siginatom : ",signinUser)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle update profile
  const handleSave = async (e) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!firstName?.trim() || !lastName?.trim()) {
      setErr("Provide both first and last name.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        FirstName: firstName.trim(),
        LastName: lastName.trim(),
        Password: password ? password : undefined,
      };

      const res = await axios.put("http://localhost:3000/api/v1/user/Update", body, authHeaders());
      setMsg(res?.data?.msg || "Profile updated.");

      const newUsername = `${firstName.trim()} ${lastName.trim()}`;
      setUsername(newUsername);
      setSigninUser((prev) => ({ ...(prev || {}), FirstName: firstName.trim(), LastName: lastName.trim() }));

      setPassword("");
    } catch (error) {
      console.error("Update failed:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        "Update failed.";
      setErr(message);
    } finally {
      setSaving(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setSigninUser({ email: "", username: "", id: "" });
    setUsername("");
    setIdAtom("");
    navigate("/");
  };

  // Optional: Delete account (dangerous)
  const handleDeleteAccount = async () => {
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    setLoading(true);
    try {
      await axios.delete("http://localhost:3000/api/delete-account", authHeaders());
      handleLogout();
    } catch (err) {
      console.error("Delete failed:", err);
      setErr("Could not delete account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-gray-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                    Account
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">Manage your profile & settings</p>
                </div>
              </div>

              {/* Right-side controls: Balance, Back, Logout */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-400/30 rounded-xl px-4 py-2">
                  <div className="text-xs text-green-300 font-medium">Balance</div>
                  <div className="text-xl font-bold text-green-400">₹{balance}</div>
                </div>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-gray-100 font-medium transition-all flex items-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-medium transition-all shadow-lg hover:shadow-red-500/50 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info Card */}
            <div className="lg:col-span-1">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-6">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg mb-4">
                    {firstName ? firstName[0].toUpperCase() : (username ? username[0].toUpperCase() : "U")}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {firstName && lastName ? `${firstName} ${lastName}` : username || "User"}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">{signinUser?.Email || "No email"}</p>
                  
                  <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-400/30 rounded-xl p-4 mb-4">
                    <div className="text-xs text-green-300 font-medium mb-1">Available Balance</div>
                    <div className="text-3xl font-bold text-green-400">₹{balance}</div>
                  </div>

                  <div className="space-y-3 text-left">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-1">Member Since</div>
                      <div className="text-sm text-gray-200 font-medium">January 2024</div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-1">Account Status</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-sm text-green-400 font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Edit Form */}
            <div className="lg:col-span-2">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                    <p className="text-sm text-gray-400">Update your personal information</p>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <label className="block">
                      <div className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        First name
                      </div>
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 placeholder-gray-500 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-all backdrop-blur-sm"
                        placeholder="First name"
                      />
                    </label>

                    <label className="block">
                      <div className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Last name
                      </div>
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 placeholder-gray-500 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-all backdrop-blur-sm"
                        placeholder="Last name"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <div className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password
                      <span className="text-xs text-gray-500">(leave empty to keep current)</span>
                    </div>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      className="w-full rounded-xl bg-slate-900/50 border border-white/10 px-4 py-3 placeholder-gray-500 text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:outline-none transition-all backdrop-blur-sm"
                      placeholder="New password"
                    />
                  </label>

                  {/* Error & Success Messages */}
                  {err && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{err}</span>
                    </div>
                  )}
                  {msg && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-start gap-3">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{msg}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFirstName(signinUser?.FirstName || "");
                        setLastName(signinUser?.LastName || "");
                        setPassword("");
                        setErr(null);
                        setMsg(null);
                      }}
                      className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-100 font-medium transition-all flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Reset</span>
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Account Info Section */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Signed in as</div>
                      <div className="font-semibold text-gray-100">{signinUser?.email || username || "Unknown"}</div>
                    </div>

                    {/* Optional delete button */}
                    {/* <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 font-medium transition-all flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete account</span>
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}