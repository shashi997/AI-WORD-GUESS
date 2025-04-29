// src/components/WordInfoDisplay.jsx
import React from 'react';

const WordInfoDisplay = ({ word, info, loading, error, onClose }) => {
  if (!word) return null; // Don't render if no word is provided yet

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            About the word: <span className="font-bold capitalize">{word}</span>
          </h3>
          <div className="mt-2 px-7 py-3 max-h-60 overflow-y-auto">
            {loading && <p className="text-sm text-gray-500">Loading information...</p>}
            {error && <p className="text-sm text-red-500 bg-red-100 p-2 rounded">{error}</p>}
            {!loading && !error && info && (
              // Replace newlines from AI with paragraphs for better formatting
              <div className="text-sm text-gray-700 text-left space-y-2">
                {info.split('\n').map((paragraph, index) => (
                  paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
                ))}
              </div>
            )}
             {!loading && !error && !info && <p className="text-sm text-gray-500">No information available.</p>}
          </div>
          <div className="items-center px-4 py-3">
            <button
              id="ok-btn"
              onClick={onClose}
              className="px-4 py-2 bg-indigo-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordInfoDisplay;
