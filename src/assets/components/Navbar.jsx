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
    <nav className="navbar">
      <div className="logo">
        <h1>Fetchgo Admin</h1>
      </div>

      <div className="links">

        <Link to="/" style={linkStyle}>Rider Registration</Link>

        <Link to="/manage-riders" style={linkStyle}>Manage Riders</Link>

        <Link to="/credit-request" style={linkStyle}>Credit Request</Link>

        <Link to="/profile-changes" style={linkStyle}>Profile Changes</Link>

        <Link to="/statistics" style={linkStyle}>Statistics</Link>

        <Link to="/archive-orders" style={linkStyle}>Archive Orders</Link>

        <Link to="/customer-users" style={linkStyle}>Customer Users</Link>

      </div>

      {currentUser && (
        <div className="user-section">
          <span className="user-email" style={{ color: 'white', marginRight: '15px' }}>
            {currentUser.email}
          </span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

const linkStyle = {
  textDecoration: "none",
  color: "white",
  margin: "0 10px",
  padding: "8px 12px",
  borderRadius: "5px",
  transition: "background-color 0.3s ease"
};
