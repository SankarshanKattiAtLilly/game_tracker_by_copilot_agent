import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Contests from './pages/Contests';
import Matches from './pages/Matches';
import MatchDetails from './pages/MatchDetails';
import Dashboard from './pages/Dashboard';
import './App.css';
import RoutePersistence from './components/RoutePersistence';
import Header from './components/Header';
import MasterDashboard from './pages/MasterDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <RoutePersistence />
          <Header />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/contests" 
              element={
                <ProtectedRoute>
                  <Contests />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contest/:contestId" 
              element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/match/:id" 
              element={
                <ProtectedRoute>
                  <MatchDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <MasterDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/contests" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
