// src/services/authService.js
import api from './api';

const register = async (userData) => {
  const response = await api.post('/users/register', userData);
  if (response.data && response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    // Optionally store user info too, but token is primary
    localStorage.setItem('userInfo', JSON.stringify({
        _id: response.data._id,
        username: response.data.username,
        email: response.data.email
    }));
  }
  return response.data; // Contains user info and token
};

const login = async (credentials) => {
  const response = await api.post('/users/login', credentials);
  if (response.data && response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('userInfo', JSON.stringify({
        _id: response.data._id,
        username: response.data.username,
        email: response.data.email
    }));
  }
  return response.data; // Contains user info and token
};

const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
};

const getCurrentUser = () => {
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');
    if (token && userInfo) {
        try {
            return JSON.parse(userInfo);
        } catch (e) {
            console.error("Error parsing user info from localStorage", e);
            logout(); // Clear invalid data
            return null;
        }
    }
    return null;
};

// Optional: Fetch fresh profile data if needed
const getProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
}


export default {
  register,
  login,
  logout,
  getCurrentUser,
  getProfile,
};
