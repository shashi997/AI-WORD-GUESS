// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GamePage from './pages/GamePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/game" element={<GamePage />} />
                {/* Add other protected routes here, e.g., profile */}
                {/* <Route path="/profile" element={<ProfilePage />} /> */}
              </Route>

              {/* Redirect root or undefined routes */}
              {/* Option 1: Redirect root to game if logged in, else to login */}
               <Route path="/" element={<Navigate replace to="/game" />} />
              {/* Option 2: Have a dedicated HomePage component */}
              {/* <Route path="/" element={<HomePage />} /> */}

              {/* Catch-all for 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          {/* Optional Footer */}
          {/* <footer className="bg-gray-200 text-center p-4 text-sm text-gray-600">
            AI Word Guess Game &copy; 2024
          </footer> */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
