// src/pages/RegisterPage.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (userData) => {
    await register(userData);
    navigate('/game'); // Redirect to game page after successful registration
  };

  return (
    <div className="container mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Register</h1>
      <AuthForm onSubmit={handleRegister} buttonText="Register" isRegister={true} />
       <p className="text-center mt-4 text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">
          Login here
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
