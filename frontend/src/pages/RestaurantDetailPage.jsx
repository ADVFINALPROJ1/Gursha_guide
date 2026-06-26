import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReviewForm from "../components/ReviewForm";
import API from "../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";

function RatingStars({ rating }) {
  const ratingNumber = Number(rating || 0);

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`${ratingNumber.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fillWidth = Math.min(Math.max(ratingNumber - star + 1, 0), 1) * 100;

        return (
          <span key={star} className="relative inline-block text-gray-300">
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

function getSavedUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user"));
  } catch {
    return null;
  }
}

function clearOldLoginStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function getReceiptStatusText(status) {
  if (status === "pending") {
    return "Pending receipt verification";
  }

  if (status === "approved") {
    return "Receipt approved";
  }

  if (status === "rejected") {
    return "Receipt rejected";
  }

  return "Receipt not submitted";
}

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewsError, setReviewsError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState("");
  const [editComment, setEditComment] = useState("");
  const [reviewActionMessage, setReviewActionMessage] = useState("");
  const [reviewActionError, setReviewActionError] = useState("");
  const [savingReviewId, setSavingReviewId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [submittingReportId, setSubmittingReportId] = useState(null);
  const [votingReviewId, setVotingReviewId] = useState(null);

  const getRestaurant = useCallback(async () => {
    try {
      const response = await API.get(`/restaurants/${id}`);
      setRestaurant(response.data);
      setError("");
      setNotFound(false);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setNotFound(true);
      } else {
        setError("Could not load this restaurant. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const getReviews = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("token");
      const requestOptions = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {};
      const response = await API.get(`/reviews/restaurant/${id}`, requestOptions);
      setReviews(response.data);
      setReviewsError("");
    } catch {
      setReviewsError("Could not load reviews. Please try again later.");
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getRestaurant();
      getReviews();
    }, 0);

    return () => clearTimeout(timer);
  }, [getRestaurant, getReviews]);

  function startEditingReview(review) {
    setEditingReviewId(review.id);
    setEditRating(Number(review.rating).toFixed(1));
    setEditComment(review.comment);
    setReviewActionMessage("");
    setReviewActionError("");
  }

  function cancelEditingReview() {
    setEditingReviewId(null);
    setEditRating("");
    setEditComment("");
    setReviewActionError("");
  }

  async function saveReview(reviewId) {
    setReviewActionMessage("");
    setReviewActionError("");

    const ratingNumber = Number(editRating);

    if (!Number.isFinite(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      setReviewActionError("Rating must be between 1 and 5.");
      return;
    }

    if (!editComment.trim()) {
      setReviewActionError("Comment is required.");
      return;
    }

    if (!token) {
      setReviewActionError("Please login before editing a review.");
      return;
    }

    setSavingReviewId(reviewId);

    try {
      const response = await API.put(
        `/reviews/${reviewId}`,
        {
          rating: ratingNumber,
          comment: editComment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReviews((currentReviews) =>
        currentReviews.map((review) =>
          review.id === reviewId
            ? { ...review, ...response.data.review }
            : review
        )
      );
      setReviewActionMessage("Review updated successfully.");
      setEditingReviewId(null);
      setEditRating("");
      setEditComment("");
      getRestaurant();
    } catch (err) {
      setReviewActionError(
        err.response?.data?.message || "Could not update review. Please try again."
      );
    } finally {
      setSavingReviewId(null);
    }
  }

  async function deleteReview(reviewId) {
    const shouldDelete = window.confirm("Delete this review?");

    if (!shouldDelete) {
      return;
    }

    setReviewActionMessage("");
    setReviewActionError("");

    if (!token) {
      setReviewActionError("Please login before deleting a review.");
      return;
    }

    setDeletingReviewId(reviewId);

    try {
      await API.delete(`/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReviews((currentReviews) =>
        currentReviews.filter((review) => review.id !== reviewId)
      );
      setReviewActionMessage("Review deleted successfully.");
      getRestaurant();
    } catch (err) {
      setReviewActionError(
        err.response?.data?.message || "Could not delete review. Please try again."
      );
    } finally {
      setDeletingReviewId(null);
    }
  }

  function startReportingReview(reviewId) {
    setReportingReviewId(reviewId);
    setReportReason("");
    setReviewActionMessage("");
    setReviewActionError("");
  }

  function cancelReportingReview() {
    setReportingReviewId(null);
    setReportReason("");
    setReviewActionError("");
  }

  async function submitReport(reviewId) {
    setReviewActionMessage("");
    setReviewActionError("");

    if (!reportReason.trim()) {
      setReviewActionError("Report reason is required.");
      return;
    }

    setSubmittingReportId(reviewId);

    try {
      await API.post("/reports", {
        reviewId,
        reason: reportReason,
      });
      setReviewActionMessage("Review reported successfully.");
      setReportingReviewId(null);
      setReportReason("");
    } catch (err) {
      setReviewActionError(
        err.response?.data?.message || "Could not report review. Please try again."
      );
    } finally {
      setSubmittingReportId(null);
    }
  }

  async function voteOnReview(reviewId, voteType) {
    setReviewActionMessage("");
    setReviewActionError("");

    if (!token) {
      setReviewActionError("Please login before voting on a review.");
      return;
    }

    setVotingReviewId(`${reviewId}-${voteType}`);

    try {
      const response = await API.patch(
        `/reviews/${reviewId}/${voteType}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReviews((currentReviews) =>
        currentReviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                upvotes: response.data.upvotes,
                downvotes: response.data.downvotes,
                user_vote: response.data.user_vote,
              }
            : review
        )
      );
    } catch (err) {
      setReviewActionError(
        err.response?.data?.message || "Could not save vote. Please try again."
      );
    } finally {
      setVotingReviewId(null);
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <section className="mx-auto max-w-4xl rounded-lg bg-white p-8 text-center shadow">
          <p className="text-lg font-semibold text-gray-900">
            Loading restaurant...
          </p>
          <p className="mt-2 text-gray-600">
            Please wait while we get the restaurant details.
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <section className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-white p-8 text-center shadow">
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <p className="mt-2 text-gray-600">
            Make sure the backend server is running and connected to PostgreSQL.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          >
            Back to Restaurants
          </Link>
        </section>
      </main>
    );
  }

  if (notFound || !restaurant) {
    return (
      <main className="p-6">
        <section className="mx-auto max-w-4xl rounded-lg bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Restaurant not found
          </h1>
          <p className="mt-2 text-gray-600">
            We could not find a restaurant with this ID.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          >
            Back to Restaurants
          </Link>
        </section>
      </main>
    );
  }

  const imageUrl = restaurant.image_url?.trim() || fallbackImage;
  const averageRating =
    restaurant.average_rating === null || restaurant.average_rating === undefined
      ? null
      : Number(restaurant.average_rating).toFixed(1);
  const reviewCount = Number(restaurant.review_count || 0);
  clearOldLoginStorage();
  const token = sessionStorage.getItem("token");
  const savedUser = token ? getSavedUser() : null;
  const currentUserId = savedUser?.id;
  const isAdmin = savedUser?.role === "admin";

  return (
    <main className="bg-gray-100 px-4 py-8">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="relative">
          <img
            src={imageUrl}
            alt={restaurant.name}
            className="h-72 w-full object-cover sm:h-80"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <p className="text-sm font-semibold text-orange-100">
              {restaurant.location}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
              {restaurant.name}
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <Link
            to="/"
            className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Back to Restaurants
          </Link>

          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <p className="text-lg leading-8 text-gray-700">
              {restaurant.description || "No description available yet."}
            </p>

            <div className="rounded border border-orange-100 bg-orange-50 p-4 shadow-sm sm:min-w-52">
              <p className="text-sm font-semibold uppercase text-orange-700">
                Average rating
              </p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-2xl font-bold text-gray-900">
                  {averageRating || "No ratings yet"}
                </p>
                {averageRating && <RatingStars rating={averageRating} />}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {reviewCount === 1 ? "1 review" : `${reviewCount} reviews`}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Recent experiences from GurshaGuide users.
                </p>
              </div>
              {averageRating && (
                <div className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                  <RatingStars rating={averageRating} /> {averageRating} / 5
                </div>
              )}
            </div>

            {reviewsLoading && (
              <p className="mt-5 rounded border border-gray-200 bg-gray-50 p-4 text-gray-600">
                Loading reviews...
              </p>
            )}

            {reviewsError && (
              <p className="mt-4 rounded bg-red-100 p-3 text-sm text-red-700">
                {reviewsError}
              </p>
            )}

            {reviewActionMessage && (
              <p className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                {reviewActionMessage}
              </p>
            )}

            {reviewActionError && (
              <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {reviewActionError}
              </p>
            )}

            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <p className="mt-5 rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center font-medium text-gray-600">
                No reviews yet
              </p>
            )}

            {!reviewsLoading && !reviewsError && reviews.length > 0 && (
              <div className="mt-5 grid gap-4">
                {reviews.map((review) => {
                  const isMyReview = currentUserId && Number(review.user_id) === Number(currentUserId);
                  const canEditReview = isMyReview;
                  const canDeleteReview = isMyReview || isAdmin;
                  const reviewRating = Number(review.rating).toFixed(1);
                  const isVerified = review.is_verified === true;
                  const isEditing = editingReviewId === review.id;
                  const isSaving = savingReviewId === review.id;
                  const isDeleting = deletingReviewId === review.id;
                  const isReporting = reportingReviewId === review.id;
                  const isSubmittingReport = submittingReportId === review.id;
                  const upvoteCount = Number(review.upvotes || 0);
                  const downvoteCount = Number(review.downvotes || 0);
                  const upvoteLoading = votingReviewId === `${review.id}-upvote`;
                  const downvoteLoading = votingReviewId === `${review.id}-downvote`;
                  const hasVoted = Boolean(review.user_vote);
                  const reviewImageUrl = review.image_url?.trim();
                  const receiptStatusText = getReceiptStatusText(
                    review.receipt_status
                  );

                  return (
                    <article
                      key={review.id}
                      className={`rounded border p-5 shadow-sm ${
                        isMyReview
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              {review.reviewer_name || "Anonymous user"}
                            </p>
                            {isMyReview && (
                              <span className="rounded bg-orange-600 px-2 py-1 text-xs font-bold text-white">
                                Your review
                              </span>
                            )}
                            <span
                              className={`rounded px-2 py-1 text-xs font-bold ${
                                isVerified
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {isVerified ? "Verified" : "Not Verified"}
                            </span>
                          </div>
                          {review.created_at && (
                            <p className="mt-1 text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div
                          className={`rounded px-3 py-2 text-sm font-semibold ${
                            isMyReview
                              ? "bg-white text-orange-700"
                              : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          <RatingStars rating={review.rating} /> {reviewRating} / 5
                        </div>
                      </div>

                      {isEditing && canEditReview ? (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label
                              htmlFor={`edit-rating-${review.id}`}
                              className="mb-1 block text-sm font-medium text-gray-700"
                            >
                              Rating
                            </label>
                            <input
                              id={`edit-rating-${review.id}`}
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={editRating}
                              onChange={(event) => setEditRating(event.target.value)}
                              className="w-28 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`edit-comment-${review.id}`}
                              className="mb-1 block text-sm font-medium text-gray-700"
                            >
                              Comment
                            </label>
                            <textarea
                              id={`edit-comment-${review.id}`}
                              value={editComment}
                              onChange={(event) => setEditComment(event.target.value)}
                              className="min-h-24 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => saveReview(review.id)}
                              disabled={isSaving}
                              className="rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingReview}
                              disabled={isSaving}
                              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-3 text-gray-700">{review.comment}</p>
                          {reviewImageUrl && (
                            <img
                              src={reviewImageUrl}
                              alt="Review"
                              className="mt-4 max-h-80 w-full rounded object-cover"
                            />
                          )}
                          <p className="mt-3 rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                            {receiptStatusText}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => voteOnReview(review.id, "upvote")}
                              disabled={Boolean(votingReviewId) || hasVoted}
                              aria-label={`Upvote review. Current upvotes: ${upvoteCount}`}
                              title="Upvote"
                              className={`inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold hover:bg-green-50 disabled:text-green-300 ${
                                review.user_vote === "upvote"
                                  ? "border-green-300 bg-green-50 text-green-700"
                                  : "border-green-200 bg-white text-green-700"
                              }`}
                            >
                              <span aria-hidden="true">👍</span>
                              <span>{upvoteLoading ? "..." : upvoteCount}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => voteOnReview(review.id, "downvote")}
                              disabled={Boolean(votingReviewId) || hasVoted}
                              aria-label={`Downvote review. Current downvotes: ${downvoteCount}`}
                              title="Downvote"
                              className={`inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold hover:bg-gray-50 disabled:text-gray-400 ${
                                review.user_vote === "downvote"
                                  ? "border-gray-400 bg-gray-100 text-gray-800"
                                  : "border-gray-300 bg-white text-gray-700"
                              }`}
                            >
                              <span aria-hidden="true">👎</span>
                              <span>{downvoteLoading ? "..." : downvoteCount}</span>
                            </button>
                          </div>
                          {isReporting ? (
                            <div className="mt-4 space-y-3">
                              <div>
                                <label
                                  htmlFor={`report-reason-${review.id}`}
                                  className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                  Report reason
                                </label>
                                <textarea
                                  id={`report-reason-${review.id}`}
                                  value={reportReason}
                                  onChange={(event) =>
                                    setReportReason(event.target.value)
                                  }
                                  className="min-h-20 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                  placeholder="Why are you reporting this review?"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => submitReport(review.id)}
                                  disabled={isSubmittingReport}
                                  className="rounded bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
                                >
                                  {isSubmittingReport ? "Reporting..." : "Submit Report"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelReportingReview}
                                  disabled={isSubmittingReport}
                                  className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => startReportingReview(review.id)}
                                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                Report
                              </button>
                              {canEditReview && (
                                <button
                                  type="button"
                                  onClick={() => startEditingReview(review)}
                                  className="rounded border border-orange-300 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                                >
                                  Edit
                                </button>
                              )}
                              {canDeleteReview && (
                                <button
                                  type="button"
                                  onClick={() => deleteReview(review.id)}
                                  disabled={isDeleting}
                                  className="rounded border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:text-red-300"
                                >
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {!isAdmin && (
            <div className="mt-8 border-t pt-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Write a Review
                </h2>
                <p className="mt-1 text-gray-600">
                  Share your experience at this restaurant.
                </p>
              </div>

              <ReviewForm
                restaurantId={id}
                onReviewSubmitted={() => {
                  getRestaurant();
                  getReviews();
                }}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
