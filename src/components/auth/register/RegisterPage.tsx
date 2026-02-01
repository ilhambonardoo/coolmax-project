"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const RegisterPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, name }),
      });

      await response.json();
      setSuccess("Account created successfully ");

      if (!response.ok) {
        throw new Error("Register failed");
      }

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setError("Register failed, please try again");
      return error;
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-700 px-8 py-8">
          <h2 className="text-center font-bold text-3xl text-white">
            Register
          </h2>
          <p className="text-center text-neutral-200 text-sm mt-2">
            Create your account to get started
          </p>
        </div>

        <div className="px-8 py-8">
          <form
            className="flex flex-col gap-5"
            action="signup"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="text-neutral-700 font-medium text-sm"
              >
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                id="name"
                placeholder="Enter your full name"
                className="px-4 py-3 rounded-lg border border-neutral-300 placeholder:text-neutral-600 bg-neutral-100 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="username"
                className="text-neutral-700 font-medium text-sm"
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                id="username"
                placeholder="Choose a username"
                className="px-4 py-3 rounded-lg border border-neutral-300 placeholder:text-neutral-600 bg-neutral-100 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-neutral-700 font-medium text-sm"
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                id="email"
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
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                id="password"
                placeholder="Create a password"
                className="px-4 py-3 rounded-lg border border-neutral-300 placeholder:text-neutral-600 bg-neutral-100 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                ✗ {error}
              </div>
            )}

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-linear-to-r from-neutral-700 to-neutral-600 hover:from-neutral-800 hover:to-neutral-700 text-white font-semibold py-3 rounded-lg transition duration-200 mt-2"
            >
              {isLoading ? "Loading" : "Create Account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-300"></div>
            <span className="text-neutral-500 text-sm">or</span>
            <div className="flex-1 h-px bg-neutral-300"></div>
          </div>

          <div className="text-center">
            <p className="text-neutral-600 text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-neutral-700 hover:text-neutral-900 transition"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-neutral-50 border-t border-neutral-200 px-8 py-4 text-center">
          <p className="text-neutral-500 text-xs">
            By signing up, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
