// src/App.jsx
// Changes: import authService from api/auth instead of appwrite/auth

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import authService from "./api/auth";           // ← changed
import { login, logout } from "./store/authSlice.js";
import { Header, Footer } from "./components/index.js";
import { Outlet } from "react-router-dom";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    authService
      .getCurrentUser()
      .then((userData) => {
        if (userData) {
          dispatch(login({ userData }));
        } else {
          dispatch(logout());
        }
      })
      .catch(() => {
      dispatch(logout());
      })
      .finally(() => setLoading(false));
  }, []);
  const authState = useSelector((state) => state.auth);

console.log(authState);

  return !loading ? (
    <div className="min-h-screen flex flex-wrap content-between bg-gray-400">
      <div className="w-full block">
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  ) : null;
}

export default App;
