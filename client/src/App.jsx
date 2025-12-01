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
import AdminHome from './pages/admin/AdminHome';
import AdminContests from './pages/admin/AdminContests';
import AdminTeams from './pages/admin/AdminTeams';
import AdminMatches from './pages/admin/AdminMatches';
import AdminEnrollments from './pages/admin/AdminEnrollments';

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
            <Route 
              path="/admin/manage" 
              element={
                <ProtectedRoute>
                  <AdminHome />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/manage/contests" 
              element={
                <ProtectedRoute>
                  <AdminContests />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/manage/teams" 
              element={
                <ProtectedRoute>
                  <AdminTeams />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/manage/matches" 
              element={
                <ProtectedRoute>
                  <AdminMatches />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/manage/enrollments" 
              element={
                <ProtectedRoute>
                  <AdminEnrollments />
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
