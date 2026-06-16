import { useState } from "react";
import API from "../services/api";

export default function ReviewForm({ restaurantId }) {
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!rating) {
      setError("Please choose a rating.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }

    setLoading(true);

    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));

      await API.post("/reviews", {
        restaurantId,
        rating: Number(rating),
        comment,
        // Temporary fallback until reviews use the logged-in user from auth.
        userId: savedUser?.id || 1,
      });

      setMessage("Review submitted successfully.");
      setRating("");
      setComment("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Could not submit review. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      {message && (
        <p className="rounded bg-green-100 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>
      )}

      <div>
        <label htmlFor="rating" className="mb-1 block font-medium text-gray-700">
          Rating
        </label>
        <select
          id="rating"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          required
        >
          <option value="">Choose a rating</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </div>

      <div>
        <label htmlFor="comment" className="mb-1 block font-medium text-gray-700">
          Comment
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-h-28 w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          placeholder="Share your restaurant experience"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
