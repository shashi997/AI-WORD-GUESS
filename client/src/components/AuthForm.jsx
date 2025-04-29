// src/components/AuthForm.jsx
import React, { useState } from 'react';

const AuthForm = ({ onSubmit, buttonText, isRegister = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Prepare data based on whether it's register or login
      const dataToSend = isRegister
        ? formData
        : { email: formData.email, password: formData.password };

      if (isRegister && (!formData.username || !formData.email || !formData.password)) {
          throw new Error("All fields are required for registration.");
      }
      if (!isRegister && (!formData.email || !formData.password)) {
          throw new Error("Email and password are required for login.");
      }

      await onSubmit(dataToSend);
      // Navigation will be handled by the parent component after successful submission
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-white rounded shadow-md">
      {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</p>}
      {isRegister && (
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="username">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required={isRegister}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="email">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="password">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={isRegister ? 6 : undefined} // Enforce minLength only on register
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Processing...' : buttonText}
      </button>
    </form>
  );
};

export default AuthForm;
