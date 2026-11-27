import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import TechnicalAids from "./pages/technical-aids/List";
import Loans from "./pages/loans/List";
import Returns from "./pages/returns/List";
import Beneficiaries from "./pages/beneficiaries/List";
import Reports from "./pages/reports/Reports";
import Inventory from "./pages/inventory/List";
import Settings from "./pages/settings/Settings";

import { isAuthenticated } from "./services/auth";

// Protect administrative routes.
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public login route */}
        <Route
          path="/login"
          element={
            isAuthenticated()
              ? <Navigate to="/" replace />
              : <Login />
          }
        />

        {/* Protected administrative routes */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/technical-aids" element={<TechnicalAids />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/beneficiaries" element={<Beneficiaries />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}
