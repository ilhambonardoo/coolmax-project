"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login Failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (error) {
      setError("Email atau Password Salah");
      return error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
        <div className=" bg-neutral-700  px-8 py-8">
          <h2 className="text-center font-bold text-3xl text-white">Sign In</h2>
          <p className="text-center text-neutral-200 text-sm mt-2">
            Welcome back, please login to your account
          </p>
        </div>

        <div className="px-8 py-8">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-neutral-700 font-medium text-sm"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-4 py-3 rounded-lg border border-neutral-300 placeholder:text-neutral-600 bg-neutral-100 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-neutral-700 font-medium text-sm"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="px-4 py-3 rounded-lg border border-neutral-300 placeholder:text-neutral-600 bg-neutral-100 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                ✗ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-neutral-700 to-neutral-600 hover:from-neutral-800 hover:to-neutral-700 disabled:from-neutral-500 disabled:to-neutral-400 text-white font-semibold py-3 rounded-lg transition duration-200 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-300"></div>
            <span className="text-neutral-500 text-sm">or</span>
            <div className="flex-1 h-px bg-neutral-300"></div>
          </div>

          <div className="text-center">
            <p className="text-neutral-600 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-neutral-700 hover:text-neutral-900 transition"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-neutral-50 border-t border-neutral-200 px-8 py-4 text-center">
          <p className="text-neutral-500 text-xs">
            We keep your account secure and private
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
