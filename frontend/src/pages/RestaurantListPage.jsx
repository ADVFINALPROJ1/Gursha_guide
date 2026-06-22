import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const fallbackImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";

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

export default function RestaurantListPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getRestaurants() {
      try {
        const response = await API.get("/restaurants");
        setRestaurants(response.data);
      } catch {
        setError("Could not load restaurants. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    getRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-5xl rounded-lg bg-white p-8 text-center shadow">
          <p className="text-lg font-semibold text-gray-900">
            Loading restaurants...
          </p>
          <p className="mt-2 text-gray-600">
            Please wait while we find places to eat.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-5xl rounded-lg border border-red-200 bg-white p-8 text-center shadow">
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <p className="mt-2 text-gray-600">
            Make sure the backend server is running and connected to PostgreSQL.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <section className="mx-auto mb-8 max-w-5xl rounded-lg bg-orange-600 px-6 py-10 text-white shadow">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide">
          GurshaGuide
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Find restaurants near you
        </h1>
        <p className="mt-3 max-w-2xl text-orange-50">
          Browse local places to eat, see where they are, and choose a spot for
          your next meal.
        </p>
      </section>

      {restaurants.length === 0 ? (
        <section className="mx-auto max-w-5xl rounded-lg bg-white p-8 text-center shadow">
          <h2 className="text-xl font-bold text-gray-900">
            No restaurants found
          </h2>
          <p className="mt-2 text-gray-600">
            Restaurants will show here after they are added to the database.
          </p>
        </section>
      ) : (
        <section className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Restaurant List
              </h2>
              <p className="text-gray-600">
                Showing {filteredRestaurants.length} restaurant
                {filteredRestaurants.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="restaurant-search"
              className="mb-2 block font-semibold text-gray-900"
            >
              Search by restaurant name
            </label>
            <input
              id="restaurant-search"
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Type a restaurant name"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>

          {filteredRestaurants.length === 0 ? (
            <section className="rounded-lg bg-white p-8 text-center shadow">
              <h2 className="text-xl font-bold text-gray-900">
                No restaurants found
              </h2>
            </section>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="overflow-hidden rounded-lg bg-white shadow"
                >
                  <img
                    src={restaurant.image_url || fallbackImage}
                    alt={restaurant.name}
                    className="h-44 w-full object-cover"
                  />

                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {restaurant.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-orange-700">
                      {restaurant.location}
                    </p>

                    <p className="mt-3 min-h-12 text-gray-700">
                      {restaurant.description || "No description available yet."}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                        No ratings yet
                      </span>

                      <Link
                        to={`/restaurants/${restaurant.id}`}
                        className="rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
