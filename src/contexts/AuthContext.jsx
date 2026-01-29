import { createContext, useContext, useState } from 'react';

// Hardcoded credentials (in a real app, this should be handled server-side)
const HARDCODED_CREDENTIALS = {
  email: 'admin@fetchgo.com',
  password: 'admin123' // Change this to your desired password
};

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const login = (email, password) => {
    if (email === HARDCODED_CREDENTIALS.email && 
        password === HARDCODED_CREDENTIALS.password) {
      const user = { email };
      setCurrentUser(user);
      // Store user in localStorage to persist login on page refresh
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  // Check for existing session on initial load
  const checkAuth = () => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
