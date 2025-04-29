// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(true); // Optional: for initial load check

  useEffect(() => {
    // Optional: Verify token on initial load or fetch profile
    // This prevents showing logged-in state briefly if token is invalid
    const verifyUser = async () => {
        if (user) { // Only if we think we have a user initially
            try {
                // Example: Fetch profile to verify token validity
                await authService.getProfile();
                // If successful, user state is already correct
            } catch (error) {
                console.error("Token verification failed", error);
                // Token is invalid or expired, log out
                logout();
            }
        }
        setLoading(false);
    };

    verifyUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser({ _id: data._id, username: data.username, email: data.email }); // Update state
    return data; // Return full response if needed
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser({ _id: data._id, username: data.username, email: data.email }); // Update state
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
