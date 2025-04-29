// src/components/GameSetup.jsx
import React, { useState } from 'react';

const GameSetup = ({ onStartGame, loading }) => {
  const [category, setCategory] = useState('random');
  const [difficulty, setDifficulty] = useState('easy');

  const handleSubmit = (e) => {
    e.preventDefault();
    onStartGame(category, difficulty);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow-md mb-6">
      <h2 className="text-2xl font-bold text-center mb-4 text-indigo-700">New Game Setup</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category-select" className="block text-sm font-medium text-gray-700">
            Choose a Category:
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50"
          >
            <option value="random">Random</option>
            <option value="tech">Tech</option>
            <option value="animals">Animals</option>
            <option value="places">Places</option>
            <option value="science">Science</option>
            <option value="interesting">Interesting Words</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Choose Difficulty:</label>
          <div className="flex justify-around items-center space-x-2 bg-gray-50 p-2 rounded">
            {['easy', 'medium', 'hard'].map((level) => (
              <label key={level} className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  id={`difficulty-${level}`}
                  name="difficulty"
                  value={level}
                  checked={difficulty === level}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={loading}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 disabled:opacity-50"
                />
                <span className="text-sm capitalize">{level}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Start Game'}
        </button>
      </form>
    </div>
  );
};

export default GameSetup;
