// src/components/GameBoard.jsx
import React from 'react';

const GameBoard = ({ wordDisplay, incorrectGuesses, maxIncorrectGuesses }) => {
  const attemptsLeft = maxIncorrectGuesses - incorrectGuesses;

  return (
    <div className="text-center p-4 bg-gray-100 rounded-lg shadow mb-6">
      <p className="text-3xl md:text-4xl font-bold tracking-widest mb-4 text-indigo-700">
        {wordDisplay || 'Loading...'}
      </p>
      <p className="text-lg text-red-600">
        Incorrect Guesses: {incorrectGuesses} / {maxIncorrectGuesses}
      </p>
      <p className="text-sm text-gray-600">
        (Attempts Left: {attemptsLeft >= 0 ? attemptsLeft : 0})
      </p>
    </div>
  );
};

export default GameBoard;
