import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/auth.store';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/*"
            element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontFamily: 'Tajawal, sans-serif'
          },
          success: {
            iconTheme: {
              primary: '#90EE90',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#DC3545',
              secondary: '#fff'
            }
          }
        }}
      />
    </>
  );
}

export default App;
