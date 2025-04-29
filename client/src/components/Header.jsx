// src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <header className="bg-indigo-600 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-indigo-200">
          AI Word Guess
        </Link>
        <div className="space-x-4 flex items-center">
          {user ? (
            <>
              <span className="text-sm hidden sm:inline">Welcome, {user.username}!</span>
              <Link to="/game" className="px-3 py-1 rounded hover:bg-indigo-700">
                Game
              </Link>
              {/* Add link to profile page if you create one */}
              {/* <Link to="/profile" className="px-3 py-1 rounded hover:bg-indigo-700">Profile</Link> */}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1 rounded hover:bg-indigo-700">
                Login
              </Link>
              <Link to="/register" className="px-3 py-1 rounded hover:bg-indigo-700">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
