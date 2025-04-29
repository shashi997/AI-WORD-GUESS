// src/components/ClueDisplay.jsx
import React from 'react';

// Accept cluesUsed and maxCluesAllowed as props
const ClueDisplay = ({
  clues = [],
  cluesUsed = 0, // Default to 0
  maxCluesAllowed = 0, // Default to 0
  onGetClue,
  loadingClue,
  disabled = false // General disabled state (e.g., game over)
}) => {

  // Determine if the clue button should be specifically disabled due to limit
  const clueLimitReached = cluesUsed >= maxCluesAllowed;
  const buttonDisabled = disabled || loadingClue || clueLimitReached;

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold text-blue-800">Clues</h3>
        {/* Display Clue Count */}
        <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
          {cluesUsed} / {maxCluesAllowed} Used
        </span>
      </div>

      {clues.length === 0 && <p className="text-sm text-gray-600 italic">No clues requested yet.</p>}
      <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto"> {/* Added max-height and scroll */}
        {clues.map((clue, index) => (
          <li key={index} className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
            <span className="font-medium text-blue-700">Clue {index + 1}:</span> {clue}
          </li>
        ))}
      </ul>
      <button
        onClick={onGetClue}
        disabled={buttonDisabled} // Use combined disabled state
        className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
        title={clueLimitReached ? `Maximum ${maxCluesAllowed} clues reached` : ''} // Add tooltip
      >
        {loadingClue ? 'Getting Clue...' : 'Get AI Clue'}
      </button>
      {clueLimitReached && !disabled && ( // Show message only if limit is the reason
          <p className="text-xs text-red-600 mt-1">Maximum clues reached.</p>
      )}
    </div>
  );
};

export default ClueDisplay;
