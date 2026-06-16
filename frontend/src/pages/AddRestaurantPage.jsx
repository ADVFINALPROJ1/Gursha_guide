import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function AddRestaurantPage() {
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const isAdmin = savedUser?.role === "admin";
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    if (!location.trim()) {
      setError("Location is required.");
      return;
    }

    setLoading(true);

    try {
      await API.post(
        "/restaurants",
        {
          name,
          location,
          description,
          imageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Restaurant added successfully.");
      setName("");
      setLocation("");
      setDescription("");
      setImageUrl("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Could not add restaurant. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6">
      <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Add Restaurant</h1>
          <p className="mt-2 text-gray-600">
            Create a new restaurant for users to view.
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

        {!isAdmin ? (
          <div className="rounded border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">Admin access required</p>
            <p className="mt-1 text-sm text-red-700">
              Please log in with an admin account to add restaurants.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            >
              Go to Login
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block font-medium text-gray-700">
              Restaurant Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              placeholder="Enter restaurant name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-1 block font-medium text-gray-700"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              placeholder="Enter location"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-28 w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              placeholder="Enter a short description"
            />
          </div>

          <div>
            <label
              htmlFor="imageUrl"
              className="mb-1 block font-medium text-gray-700"
            >
              Image URL
            </label>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
              placeholder="https://example.com/restaurant.jpg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
          >
            {loading ? "Adding restaurant..." : "Add Restaurant"}
          </button>
        </form>
        )}
      </section>
    </main>
  );
}
