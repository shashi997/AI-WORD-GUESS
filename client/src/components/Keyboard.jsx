// src/components/Keyboard.jsx
import React from 'react';

const Keyboard = ({ onGuess, guessedLetters = [], disabled = false }) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  return (
    <div className="flex flex-wrap justify-center gap-2 p-4 max-w-xl mx-auto">
      {alphabet.map((letter) => {
        const isGuessed = guessedLetters.includes(letter);
        return (
          <button
            key={letter}
            onClick={() => onGuess(letter)}
            disabled={isGuessed || disabled}
            className={`
              w-10 h-10 sm:w-12 sm:h-12 rounded-md border-2 font-bold text-lg uppercase
              flex items-center justify-center transition duration-150 ease-in-out
              ${isGuessed
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed border-gray-400'
                : 'bg-white text-indigo-700 border-indigo-500 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400'
              }
              ${disabled && !isGuessed ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
};

export default Keyboard;
