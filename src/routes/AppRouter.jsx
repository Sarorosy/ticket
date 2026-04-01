import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Layout from "../layouts/Layout";
import ScrollToTop from "../components/ScrollToTop";
import { useAuth } from "../utils/idb";
import { useEffect } from "react";
import Dashboard from "../pages/Dashboard";
import Login from '../pages/Login';
import LoginWithRcUserId from '../pages/LoginWithRcUserId';
import Users from "../components/users/Users";
import LoginAsStudent from "../pages/LoginAsStudent";

export default function AppRouter() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Restaurant Routes (NO layout) */}
        <Route path="/login" element={<LoginWithRcUserId />} />
        <Route path="/studentlogin" element={<LoginAsStudent />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
        
      </Routes>
    </Router>
  );
}
