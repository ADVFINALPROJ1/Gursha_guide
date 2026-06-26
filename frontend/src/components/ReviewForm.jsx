import { useRef, useState } from "react";
import API from "../services/api";

function RatingStars({ rating }) {
  const ratingNumber = Number(rating || 0);

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const fillWidth = Math.min(Math.max(ratingNumber - star + 1, 0), 1) * 100;

        return (
          <span key={star} className="relative inline-block text-3xl text-gray-300">
            ★
            <span
              className="absolute inset-0 overflow-hidden text-amber-400"
              style={{ width: `${fillWidth}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
}

function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user"));
  } catch {
    return null;
  }
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

export default function ReviewForm({ restaurantId, onReviewSubmitted }) {
  const [rating, setRating] = useState("4.0");
  const [comment, setComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const reviewImageInputRef = useRef(null);
  const receiptImageInputRef = useRef(null);

  function chooseImage(file, setImage) {
    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      setImage(null);
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Please choose an image smaller than 1 MB.");
      setImage(null);
      return;
    }

    setError("");
    setImage(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const token = sessionStorage.getItem("token");
    const savedUser = token ? getSessionUser() : null;

    if (!token) {
      setError("Please login or register before submitting a review.");
      return;
    }

    if (savedUser?.role === "admin") {
      setError("Admins cannot submit reviews.");
      return;
    }

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
      const reviewImageData = await readImageFile(reviewImage);
      const receiptImageData = await readImageFile(receiptImage);

      await API.post(
        "/reviews",
        {
          restaurantId,
          rating: Number(rating),
          comment,
          imageUrl: reviewImageData,
          receiptUrl: receiptImageData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Review submitted successfully.");
      setRating("4.0");
      setComment("");
      setReviewImage(null);
      setReceiptImage(null);
      if (reviewImageInputRef.current) {
        reviewImageInputRef.current.value = "";
      }
      if (receiptImageInputRef.current) {
        receiptImageInputRef.current.value = "";
      }
      onReviewSubmitted?.();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Could not submit review. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 space-y-5 rounded border border-gray-200 bg-gray-50 p-5"
    >
      {message && (
        <p className="rounded border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div>
        <p className="mb-2 block font-medium text-gray-700" id="rating-label">
          Rating
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <RatingStars rating={rating} />
          <span className="rounded bg-white px-3 py-1 text-sm font-bold text-orange-700 shadow-sm">
            {Number(rating).toFixed(1)} / 5
          </span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_96px]">
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="accent-orange-600"
            aria-labelledby="rating-label"
          />
          <input
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-center font-semibold focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            aria-label="Rating number"
          />
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="mb-1 block font-medium text-gray-700">
          Comment
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-h-28 w-full rounded border border-gray-300 bg-white px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
          placeholder="Share your restaurant experience"
          required
        />
      </div>

      <div>
        <label
          htmlFor="review-image"
          className="mb-1 block font-medium text-gray-700"
        >
          Review Image
        </label>
        <input
          id="review-image"
          ref={reviewImageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) =>
            chooseImage(event.target.files?.[0], setReviewImage)
          }
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
        <p className="mt-1 text-sm text-gray-500">
          Review image is optional. Use an image smaller than 1 MB.
        </p>
        {reviewImage && (
          <p className="mt-1 text-sm font-medium text-gray-600">
            Selected: {reviewImage.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="receipt-image"
          className="mb-1 block font-medium text-gray-700"
        >
          Receipt Image
        </label>
        <input
          id="receipt-image"
          ref={receiptImageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) =>
            chooseImage(event.target.files?.[0], setReceiptImage)
          }
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
        <p className="mt-1 text-sm text-gray-500">
          Receipt is optional and can be used for verification later. Use an image
          smaller than 1 MB.
        </p>
        {receiptImage && (
          <p className="mt-1 text-sm font-medium text-gray-600">
            Selected: {receiptImage.name}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-orange-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-orange-700 disabled:bg-orange-300 sm:w-auto"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
