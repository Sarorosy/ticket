import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Layout from "../layouts/Layout";
import ScrollToTop from "../components/ScrollToTop";
import { useAuth } from "../utils/idb";
import { useEffect } from "react";
import Dashboard from "../pages/Dashboard";
import Login from '../pages/Login';
import LoginWithRcUserId from '../pages/LoginWithRcUserId';

export default function AppRouter() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Restaurant Routes (NO layout) */}
        <Route path="/login" element={<LoginWithRcUserId />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Route>
        
      </Routes>
    </Router>
  );
}
