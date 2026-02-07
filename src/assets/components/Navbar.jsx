import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./navbar.css";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <h1>Fetchgo Admin</h1>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="nav-links">
          <Link to="/" className="nav-link">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Rider Registration</span>
          </Link>

          <Link to="/manage-riders" className="nav-link">
            <span className="nav-icon">👥</span>
            <span className="nav-text">Manage Riders</span>
          </Link>

          <Link to="/credit-request" className="nav-link">
            <span className="nav-icon">💳</span>
            <span className="nav-text">Credit Request</span>
          </Link>

          <Link to="/profile-changes" className="nav-link">
            <span className="nav-icon">✏️</span>
            <span className="nav-text">Profile Changes</span>
          </Link>

          <Link to="/statistics" className="nav-link">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Statistics</span>
          </Link>

          <Link to="/archive-orders" className="nav-link">
            <span className="nav-icon">📦</span>
            <span className="nav-text">Archive Orders</span>
          </Link>

          <Link to="/customer-users" className="nav-link">
            <span className="nav-icon">👤</span>
            <span className="nav-text">Customer Users</span>
          </Link>
          
          <Link to="/orders" className="nav-link">
            <span className="nav-icon">📋</span>
            <span className="nav-text">Orders</span>
          </Link>

          <Link to="/chat" className="nav-link">
            <span className="nav-icon">💬</span>
            <span className="nav-text">Chat</span>
          </Link>
        </div>
      </div>

      {currentUser && (
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-email">{currentUser.email}</span>
            <button onClick={handleLogout} className="logout-button">
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
