import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;

  useEffect(() => {
    if (isAuthenticated) {
      // Prefer redirecting to attempted route or lastPath
      const stored = window.localStorage.getItem('lastPath');
      const target = from || stored || '/contests';
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login(username.trim(), password);
    } catch (err) {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = loading || isSubmitting;

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎯 Match Betting</h1>
          <p>Sign in to place your bets</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isFormDisabled}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isFormDisabled}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isFormDisabled || !username.trim() || !password.trim()}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-help">
          <p>Demo users: alice, bob, charlie</p>
          <p>Password = username</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
