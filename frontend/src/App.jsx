import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Role pages
import ElderlyHome from "./pages/elderly/ElderlyHome";
import RequestStatus from "./pages/elderly/RequestStatus";
import FamilyDashboard from "./pages/family/FamilyDashboard";
import MedicineManager from "./pages/family/MedicineManager";
import VolunteerFeed from "./pages/volunteer/VolunteerFeed";
import ActiveTask from "./pages/volunteer/ActiveTask";

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Elderly */}
            <Route
              path="/elderly"
              element={
                <ProtectedRoute allowedRoles={["elderly"]}>
                  <ElderlyHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elderly/requests"
              element={
                <ProtectedRoute allowedRoles={["elderly"]}>
                  <RequestStatus />
                </ProtectedRoute>
              }
            />

            {/* Family */}
            <Route
              path="/family"
              element={
                <ProtectedRoute allowedRoles={["family"]}>
                  <FamilyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/family/medicine"
              element={
                <ProtectedRoute allowedRoles={["family"]}>
                  <MedicineManager />
                </ProtectedRoute>
              }
            />

            {/* Volunteer */}
            <Route
              path="/volunteer"
              element={
                <ProtectedRoute allowedRoles={["volunteer"]}>
                  <VolunteerFeed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteer/task/:requestId"
              element={
                <ProtectedRoute allowedRoles={["volunteer"]}>
                  <ActiveTask />
                </ProtectedRoute>
              }
            />

            {/* Default */}
            <Route path="/" element={<RoleRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
