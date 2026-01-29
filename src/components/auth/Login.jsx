import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import "./Login.css";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, checkAuth, currentUser } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
    if (currentUser) {
      navigate('/');
    }
  }, [checkAuth, currentUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  // Update the return statement in your Login component
return (
  <div className="login-container">
    <div className="login-box">
      <h1 className="login-title">FetchGo Admin</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn-login"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="login-footer">
        <p>FetchGo Admin Panel</p>
      </div>
    </div>
  </div>
);
}

export default Login;
