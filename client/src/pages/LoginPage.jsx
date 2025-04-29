// src/pages/LoginPage.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (credentials) => {
    await login(credentials);
    navigate('/game'); // Redirect to game page after successful login
  };

  return (
    <div className="container mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Login</h1>
      <AuthForm onSubmit={handleLogin} buttonText="Login" />
      <p className="text-center mt-4 text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="text-indigo-600 hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
