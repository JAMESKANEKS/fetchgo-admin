import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import Login from "./components/auth/Login";
import RiderRegistration from "./pages/RiderRegistration";
import ManageRiders from "./pages/ManageRiders";
import CreditRequest from "./pages/CreditRequest";
import ProfileChanges from "./pages/ProfileChanges";
import Statistics from "./pages/Statistics";
import ArchiveOrders from "./pages/ArchiveOrders";
import Navbar from "./assets/components/Navbar";
import CustomerUsers from "./pages/CustomerUsers";

function AppContent() {
  const { currentUser } = useAuth();
  
  return (
    <>
      {currentUser && <Navbar />}
      <Routes>
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" replace />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <RiderRegistration />
            </PrivateRoute>
          }
        />
        <Route
          path="/manage-riders"
          element={
            <PrivateRoute>
              <ManageRiders />
            </PrivateRoute>
          }
        />
        <Route
          path="/credit-request"
          element={
            <PrivateRoute>
              <CreditRequest />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile-changes"
          element={
            <PrivateRoute>
              <ProfileChanges />
            </PrivateRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <PrivateRoute>
              <Statistics />
            </PrivateRoute>
          }
        />
        <Route
          path="/archive-orders"
          element={
            <PrivateRoute>
              <ArchiveOrders />
            </PrivateRoute>
          }
        />
        <Route
          path="/customer-users"
          element={
            <PrivateRoute>
              <CustomerUsers />
            </PrivateRoute>
          }
        />
        
        {/* Redirect any unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// Main App component that wraps everything with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
