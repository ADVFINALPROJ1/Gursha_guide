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

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewsError, setReviewsError] = useState("");
  const [notFound, setNotFound] = useState(false);

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
      const response = await API.get(`/reviews/restaurant/${id}`);
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
            Make sure the backend server is running on port 5002.
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
  const savedUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = savedUser?.id;

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

            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <p className="mt-5 rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center font-medium text-gray-600">
                No reviews yet
              </p>
            )}

            {!reviewsLoading && !reviewsError && reviews.length > 0 && (
              <div className="mt-5 grid gap-4">
                {reviews.map((review) => {
                  const isMyReview = currentUserId && Number(review.user_id) === Number(currentUserId);
                  const reviewRating = Number(review.rating).toFixed(1);

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
                      <p className="mt-3 text-gray-700">{review.comment}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-8 border-t pt-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
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
        </div>
      </section>
    </main>
  );
}
