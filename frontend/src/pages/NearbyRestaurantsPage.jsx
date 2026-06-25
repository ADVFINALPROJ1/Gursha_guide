import { Link } from "react-router-dom";
import { useState } from "react";
import API from "../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";
const demoLatitude = 9.03;
const demoLongitude = 38.74;

function RatingStars({ rating }) {
  const ratingNumber = Number(rating || 0);

  return (
    <span
      className="inline-flex items-center gap-0.5"
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

export default function NearbyRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadNearbyRestaurants(latitude, longitude, message = "") {
    try {
      const response = await API.get(
        `/restaurants/nearby?lat=${latitude}&lng=${longitude}&radiusKm=20`
      );

      setRestaurants(response.data);
      setNotice(message);
    } catch {
      setError("Could not load nearby restaurants. Please try again later.");
      setNotice("");
    } finally {
      setLoading(false);
    }
  }

  function findNearbyRestaurants() {
    setLoading(true);
    setError("");
    setNotice("");
    setHasSearched(true);

    if (!navigator.geolocation) {
      loadNearbyRestaurants(
        demoLatitude,
        demoLongitude,
        "Your browser does not support location search, so demo Addis Ababa results are shown."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        loadNearbyRestaurants(latitude, longitude);
      },
      (locationError) => {
        if (locationError.code === locationError.PERMISSION_DENIED) {
          setLoading(false);
          setError("Location permission was denied. Please allow location access for this browser and site.");
        } else if (locationError.code === locationError.POSITION_UNAVAILABLE) {
          loadNearbyRestaurants(
            demoLatitude,
            demoLongitude,
            "Your location is currently unavailable, so demo Addis Ababa results are shown."
          );
        } else if (locationError.code === locationError.TIMEOUT) {
          loadNearbyRestaurants(
            demoLatitude,
            demoLongitude,
            "Finding your location took too long, so demo Addis Ababa results are shown."
          );
        } else {
          loadNearbyRestaurants(
            demoLatitude,
            demoLongitude,
            "Could not get your location, so demo Addis Ababa results are shown."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function useSampleLocation() {
    setLoading(true);
    setError("");
    setNotice("");
    setHasSearched(true);
    loadNearbyRestaurants(
      demoLatitude,
      demoLongitude,
      "Demo Addis Ababa results are shown."
    );
  }

  return (
    <main className="p-6">
      <section className="mx-auto max-w-5xl rounded-lg bg-white p-6 shadow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Restaurants Near Me
            </h1>
            <p className="mt-2 text-gray-600">
              Find restaurants within 20 km, sorted from highest rated to lowest rated.
            </p>
          </div>

          <button
            type="button"
            onClick={findNearbyRestaurants}
            disabled={loading}
            className="rounded bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
          >
            {loading ? "Finding restaurants..." : "Find restaurants near me"}
          </button>
        </div>
      </section>

      {error && (
        <section className="mx-auto mt-5 max-w-5xl rounded border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={useSampleLocation}
            disabled={loading}
            className="mt-3 rounded bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:text-red-300"
          >
            Use demo Addis Ababa location
          </button>
        </section>
      )}

      {notice && (
        <section className="mx-auto mt-5 max-w-5xl rounded border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          {notice}
        </section>
      )}

      {loading && (
        <section className="mx-auto mt-5 max-w-5xl rounded border border-gray-200 bg-white p-5 text-gray-600 shadow-sm">
          Getting your location and loading nearby restaurants...
        </section>
      )}

      {!loading && hasSearched && !error && restaurants.length === 0 && (
        <section className="mx-auto mt-5 max-w-5xl rounded border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            No nearby restaurants found
          </h2>
          <p className="mt-2 text-gray-600">
            Add latitude and longitude values to restaurants to test this page.
          </p>
        </section>
      )}

      {!loading && restaurants.length > 0 && (
        <section className="mx-auto mt-6 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => {
            const averageRating =
              restaurant.average_rating === null ||
              restaurant.average_rating === undefined ||
              Number(restaurant.average_rating) === 0
                ? null
                : Number(restaurant.average_rating).toFixed(1);
            const reviewCount = Number(restaurant.review_count || 0);
            const distanceKm = Number(restaurant.distance_km || 0).toFixed(2);

            return (
              <article
                key={restaurant.id}
                className="overflow-hidden rounded-lg bg-white shadow"
              >
                <img
                  src={restaurant.image_url || fallbackImage}
                  alt={restaurant.name}
                  className="h-44 w-full object-cover"
                />

                <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {restaurant.name}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-orange-700">
                    {restaurant.location}
                  </p>
                  <p className="mt-3 min-h-12 text-gray-700">
                    {restaurant.description || "No description available yet."}
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    {averageRating ? (
                      <p className="font-semibold text-gray-800">
                        <RatingStars rating={averageRating} /> {averageRating} / 5
                      </p>
                    ) : (
                      <p className="font-semibold text-gray-600">
                        No ratings yet
                      </p>
                    )}
                    <p className="text-gray-600">
                      {reviewCount === 1 ? "1 review" : `${reviewCount} reviews`}
                    </p>
                    <p className="font-semibold text-gray-800">
                      {distanceKm} km away
                    </p>
                  </div>

                  <Link
                    to={`/restaurants/${restaurant.id}`}
                    className="mt-4 inline-block rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
