import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function getRestaurant() {
      try {
        const response = await API.get(`/restaurants/${id}`);
        setRestaurant(response.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setNotFound(true);
        } else {
          setError("Could not load this restaurant. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    }

    getRestaurant();
  }, [id]);

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

  return (
    <main className="p-6">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-lg bg-white shadow">
        <img
          src={imageUrl}
          alt={restaurant.name}
          className="h-72 w-full object-cover"
        />

        <div className="p-6">
          <Link
            to="/"
            className="text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            Back to Restaurants
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {restaurant.name}
          </h1>
          <p className="mt-2 font-medium text-orange-700">
            {restaurant.location}
          </p>

          <p className="mt-5 text-gray-700">
            {restaurant.description || "No description available yet."}
          </p>

          <div className="mt-8 border-t pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                <p className="mt-1 text-gray-600">
                  Reviews will be shown here in a later update.
                </p>
              </div>

              <button
                type="button"
                className="rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
              >
                Write a Review
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
