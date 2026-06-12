import { useState } from "react";
import API from "../services/api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/register", {
        fullName,
        phoneNumber,
        password,
      });

      setMessage(response.data.message || "Registration successful");
      setFullName("");
      setPhoneNumber("");
      setPassword("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message  || "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
      <section className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-gray-600">
            Register with your phone number to join GurshaGuide.
          </p>
        </div>

        {message && (
          <p className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1 block font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="mb-1 block font-medium text-gray-700"
            >
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="text"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              placeholder="Enter phone number"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </section>
    </main>
  );
}