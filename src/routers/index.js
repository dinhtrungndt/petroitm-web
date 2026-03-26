import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/users/login/LoginPage';
// import DashboardPage from '../pages/DashboardPage'; // Tạo file này sau

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Vui lòng đợi...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const Routers = () => {
  return (
    <Routes>
      {/* Mặc định vào Login */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Trang Dashboard bảo vệ */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div className="p-20 text-center font-bold text-3xl text-blue-700">
              DASHBOARD - LOGIN THÀNH CÔNG RỒI NÈ!
            </div>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default Routers;
