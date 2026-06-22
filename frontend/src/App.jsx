import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RestaurantListPage from "./pages/RestaurantListPage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import AddRestaurantPage from "./pages/AddRestaurantPage";

function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user"));
  } catch {
    return null;
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const token = sessionStorage.getItem("token");
    return token ? getSessionUser() : null;
  });

  function handleLogin(user) {
    setCurrentUser(user);
  }

  function handleLogout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <nav className="flex flex-wrap items-center justify-between gap-4 bg-orange-600 p-4 text-white">
          <div className="flex flex-wrap gap-4 font-semibold">
            <Link to="/">Restaurants</Link>
            {currentUser?.role === "admin" && (
              <Link to="/admin/add-restaurant">Add Restaurant</Link>
            )}
          </div>

          {currentUser ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded bg-white/15 px-3 py-2 text-sm">
                <span className="font-semibold">{currentUser.fullName}</span>
                <span className="ml-2 rounded bg-white px-2 py-1 text-xs font-bold uppercase text-orange-700">
                  {currentUser.role}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-white/70 px-3 py-2 text-sm font-semibold hover:bg-white hover:text-orange-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 font-semibold">
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </div>
          )}
        </nav>

        <Routes>
          <Route path="/" element={<RestaurantListPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/admin/add-restaurant" element={<AddRestaurantPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
