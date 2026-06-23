import { useCallback, useEffect, useState } from "react";
import API from "../services/api";

function getSuspensionStatus(user) {
  if (user.suspended_permanent) {
    return {
      label: "Suspended forever",
      active: true,
      className: "bg-red-100 text-red-700",
    };
  }

  if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
    return {
      label: `Suspended until ${new Date(user.suspended_until).toLocaleDateString()}`,
      active: true,
      className: "bg-orange-100 text-orange-700",
    };
  }

  return {
    label: "Active",
    active: false,
    className: "bg-green-100 text-green-700",
  };
}

export default function AdminUsersPage() {
  const token = sessionStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [workingUserId, setWorkingUserId] = useState(null);

  const getUsers = useCallback(async () => {
    try {
      const response = await API.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getUsers();
    }, 0);

    return () => clearTimeout(timer);
  }, [getUsers]);

  async function unsuspendUser(userId) {
    const shouldUnsuspend = window.confirm("Unsuspend this user?");

    if (!shouldUnsuspend) {
      return;
    }

    setMessage("");
    setError("");
    setWorkingUserId(userId);

    try {
      const response = await API.post(
        `/users/${userId}/unsuspend`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId ? response.data.user : user
        )
      );
      setMessage("User unsuspended successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not unsuspend user.");
    } finally {
      setWorkingUserId(null);
    }
  }

  return (
    <main className="p-6">
      <section className="mx-auto max-w-5xl rounded-lg bg-white p-6 shadow">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <p className="mt-2 text-gray-600">
            View user suspension status and restore suspended accounts.
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

        {loading ? (
          <p className="rounded bg-gray-50 p-4 text-gray-600">
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center font-medium text-gray-600">
            No users found
          </p>
        ) : (
          <div className="grid gap-4">
            {users.map((user) => {
              const status = getSuspensionStatus(user);
              const isWorking = workingUserId === user.id;

              return (
                <article
                  key={user.id}
                  className="rounded border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {user.full_name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {user.phone_number}
                      </p>
                      <p className="mt-1 text-sm font-semibold uppercase text-orange-700">
                        {user.role}
                      </p>
                      {user.suspension_reason && (
                        <p className="mt-2 text-sm text-gray-600">
                          Reason: {user.suspension_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-3 py-1 text-sm font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                      {status.active && (
                        <button
                          type="button"
                          onClick={() => unsuspendUser(user.id)}
                          disabled={isWorking}
                          className="rounded border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:text-green-300"
                        >
                          {isWorking ? "Unsuspending..." : "Unsuspend"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
