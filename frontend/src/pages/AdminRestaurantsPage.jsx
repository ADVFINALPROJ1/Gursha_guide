import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user"));
  } catch {
    return null;
  }
}

export default function AdminRestaurantsPage() {
  const token = sessionStorage.getItem("token");
  const savedUser = token ? getSessionUser() : null;
  const isAdmin = savedUser?.role === "admin";
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    imageUrl: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  function startEditing(restaurant) {
    setEditingId(restaurant.id);
    setFormData({
      name: restaurant.name || "",
      location: restaurant.location || "",
      description: restaurant.description || "",
      imageUrl: restaurant.image_url || "",
    });
    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setFormData({
      name: "",
      location: "",
      description: "",
      imageUrl: "",
    });
    setError("");
  }

  function updateField(field, value) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  }

  async function saveRestaurant(restaurantId) {
    setMessage("");
    setError("");

    if (!formData.name.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    if (!formData.location.trim()) {
      setError("Location is required.");
      return;
    }

    setSavingId(restaurantId);

    try {
      const response = await API.put(
        `/restaurants/${restaurantId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRestaurants((currentRestaurants) =>
        currentRestaurants.map((restaurant) =>
          restaurant.id === restaurantId
            ? { ...restaurant, ...response.data.restaurant }
            : restaurant
        )
      );
      setMessage("Restaurant updated successfully.");
      cancelEditing();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not update restaurant. Please try again."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRestaurant(restaurantId) {
    const shouldDelete = window.confirm("Delete this restaurant?");

    if (!shouldDelete) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingId(restaurantId);

    try {
      await API.delete(`/restaurants/${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRestaurants((currentRestaurants) =>
        currentRestaurants.filter((restaurant) => restaurant.id !== restaurantId)
      );
      setMessage("Restaurant deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete restaurant. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="p-6">
      <section className="mx-auto max-w-5xl rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Restaurants
            </h1>
            <p className="mt-2 text-gray-600">
              Edit restaurant details or remove restaurants.
            </p>
          </div>
          <Link
            to="/admin/add-restaurant"
            className="rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          >
            Add Restaurant
          </Link>
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
              Please log in with an admin account to manage restaurants.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            >
              Go to Login
            </Link>
          </div>
        ) : loading ? (
          <p className="rounded bg-gray-50 p-4 text-gray-600">
            Loading restaurants...
          </p>
        ) : restaurants.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center font-medium text-gray-600">
            No restaurants found
          </p>
        ) : (
          <div className="grid gap-4">
            {restaurants.map((restaurant) => {
              const isEditing = editingId === restaurant.id;
              const isSaving = savingId === restaurant.id;
              const isDeleting = deletingId === restaurant.id;

              return (
                <article
                  key={restaurant.id}
                  className="rounded border border-gray-200 p-4"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`name-${restaurant.id}`}
                            className="mb-1 block font-medium text-gray-700"
                          >
                            Restaurant Name
                          </label>
                          <input
                            id={`name-${restaurant.id}`}
                            type="text"
                            value={formData.name}
                            onChange={(event) =>
                              updateField("name", event.target.value)
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`location-${restaurant.id}`}
                            className="mb-1 block font-medium text-gray-700"
                          >
                            Location
                          </label>
                          <input
                            id={`location-${restaurant.id}`}
                            type="text"
                            value={formData.location}
                            onChange={(event) =>
                              updateField("location", event.target.value)
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`description-${restaurant.id}`}
                          className="mb-1 block font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <textarea
                          id={`description-${restaurant.id}`}
                          value={formData.description}
                          onChange={(event) =>
                            updateField("description", event.target.value)
                          }
                          className="min-h-24 w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`imageUrl-${restaurant.id}`}
                          className="mb-1 block font-medium text-gray-700"
                        >
                          Image URL
                        </label>
                        <input
                          id={`imageUrl-${restaurant.id}`}
                          type="url"
                          value={formData.imageUrl}
                          onChange={(event) =>
                            updateField("imageUrl", event.target.value)
                          }
                          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveRestaurant(restaurant.id)}
                          disabled={isSaving}
                          className="rounded bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:bg-orange-300"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="rounded border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {restaurant.name}
                        </h2>
                        <p className="mt-1 font-medium text-orange-700">
                          {restaurant.location}
                        </p>
                        <p className="mt-2 text-gray-700">
                          {restaurant.description || "No description available yet."}
                        </p>
                        {restaurant.image_url && (
                          <p className="mt-2 break-all text-sm text-gray-500">
                            {restaurant.image_url}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(restaurant)}
                          className="rounded border border-orange-300 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRestaurant(restaurant.id)}
                          disabled={isDeleting}
                          className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:text-red-300"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
