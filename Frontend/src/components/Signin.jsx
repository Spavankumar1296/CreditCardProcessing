import axios from "axios"
import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { usernameAtom } from "../store/atoms/atoms"
import { useRecoilState } from "recoil"

export function Signin() {
    const divref = useRef()
    const Navigate = useNavigate()
    const eref = useRef()
    const [val, setval] = useState("Show Password")
    const [username, setusername] = useRecoilState(usernameAtom);


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-gray-100 flex items-center justify-center p-6">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Header with Icon */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-4">
                            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-gray-400 mt-2">Enter your credentials to sign in</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                ref={eref}
                                placeholder="Bujji@gmail.com"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-300 text-white placeholder-gray-500 hover:bg-white/10"
                                type="email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    placeholder="Enter your password"
                                    ref={divref}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-300 text-white placeholder-gray-500 hover:bg-white/10"
                                    type="password"
                                />
                            </div>
                            <button
                                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium mt-2 transition-colors flex items-center gap-1"
                                onClick={() => {
                                    if (val === "Show Password") {
                                        divref.current.type = "text"
                                        setval("Hide Password")
                                    } else {
                                        divref.current.type = "password"
                                        setval("Show Password")
                                    }
                                }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    {val === "Show Password" ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    )}
                                </svg>
                                {val}
                            </button>
                        </div>

                        <button
                            onClick={async () => {
                                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/Signin`, {
                                    Email: eref.current.value,
                                    Password: divref.current.value
                                })
                                if (response.data.msg.includes("welcome back")) {
                                    console.log("sigin response token set", response.data.token)
                                    localStorage.setItem("token", "Bearer " + response.data.token)
                                    const data = response.data.msg.split(" ")[2]
                                    setusername(response.data.username)
                                    alert(response.data.msg)
                                    Navigate('/Dashboard')
                                    return
                                }
                                alert(response.data.msg)
                            }}
                            className="w-full mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <span>Sign In</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                        </button>

                        <div className="text-center mt-6 pt-6 border-t border-white/10">
                            <p className="text-gray-400 text-sm">
                                New to payments app?
                                <button
                                    onClick={() => {
                                        Navigate('/')
                                    }}
                                    className="text-indigo-400 hover:text-indigo-300 font-semibold ml-2 hover:underline transition-all"
                                >
                                    Sign Up
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}