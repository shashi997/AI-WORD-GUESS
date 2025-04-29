// src/pages/GamePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import gameService from '../services/gameService';
import GameBoard from '../components/GameBoard';
import Keyboard from '../components/Keyboard';
import ClueDisplay from '../components/ClueDisplay';
import GameSetup from '../components/GameSetup'; // Import GameSetup
import WordInfoDisplay from '../components/WordInfoDisplay'; // Import WordInfoDisplay
// import { useAuth } from '../contexts/AuthContext'; // To ensure user is logged in

const GamePage = () => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingClue, setLoadingClue] = useState(false);
  // const { user } = useAuth(); // Get user info if needed
  const [showSetup, setShowSetup] = useState(true); // Start with setup screen


  // State for Word Info Modal
  const [showWordInfo, setShowWordInfo] = useState(false);
  const [wordInfo, setWordInfo] = useState({ word: '', info: '', loading: false, error: '' });

  // --- Game State Management ---

  const clearGameState = () => {
    setGameState(null);
    localStorage.removeItem('currentGameId');
    setShowSetup(true); // Go back to setup screen
    setError('');
    setShowWordInfo(false); // Close word info modal if open
    setWordInfo({ word: '', info: '', loading: false, error: '' }); // Reset word info state
  };

  const updateLocalGameState = (gameData) => {
    setGameState(gameData);
    if (gameData && gameData._id) {
        localStorage.setItem('currentGameId', gameData._id);
        setShowSetup(false); // Hide setup once game is active
    } else {
        clearGameState(); // If game data is invalid, clear state
    }
  };

  // --- API Call Handlers ---

  const handleStartNewGame = useCallback(async (category, difficulty) => {
    setLoading(true);
    setError('');
    setGameState(null); // Clear previous state visually
    localStorage.removeItem('currentGameId'); // Clear old ID
    setShowWordInfo(false); // Ensure word info modal is closed
    setWordInfo({ word: '', info: '', loading: false, error: '' }); // Reset word info

    try {
      // Pass category and difficulty to the service
      const data = await gameService.startGame(category, difficulty);
      updateLocalGameState(data.game);
    } catch (err) {
      console.error("Error starting new game:", err);
      setError(err.response?.data?.message || 'Failed to start new game.');
      clearGameState(); // Reset to setup on error
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed here

  const fetchGameState = useCallback(async (sessionId) => {
    if (!sessionId) {
        setShowSetup(true); // No session ID, show setup
        return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await gameService.getGameState(sessionId);
      updateLocalGameState(data.game);
    } catch (err) {
      console.error("Error fetching game state:", err);
      setError(err.response?.data?.message || 'Failed to load game state.');
      clearGameState(); // Clear invalid session ID and show setup
    } finally {
      setLoading(false);
    }
  }, []); // Dependency on updateLocalGameState (implicitly via clearGameState)

  // Load existing game on mount
  useEffect(() => {
    const existingGameId = localStorage.getItem('currentGameId');
    if (existingGameId) {
      fetchGameState(existingGameId);
    } else {
      setShowSetup(true); // Ensure setup is shown if no ID
    }
  }, [fetchGameState]);

  const handleGuess = async (letter) => {
    if (!gameState || gameState.isGameOver || loading) return;

    setLoading(true);
    setError('');
    try {
      const data = await gameService.submitGuess(gameState._id, letter);
      updateLocalGameState(data.game); // Update with the latest state
    } catch (err) {
      console.error("Error submitting guess:", err);
      setError(err.response?.data?.message || 'Failed to submit guess.');
      // Don't clear game state on guess error, allow retry
    } finally {
      setLoading(false);
    }
  };

  const handleGetClue = async () => {
    if (!gameState || gameState.isGameOver || loadingClue || (gameState.clues.length >= gameState.maxCluesAllowed)) return;

    setLoadingClue(true);
    setError('');
    try {
      const data = await gameService.getClue(gameState._id);
      // Update only the necessary parts of the state from response
      setGameState(prevState => ({
        ...prevState,
        clues: data.allClues || prevState.clues,
        // Optionally update other fields if backend sends them (e.g., cluesRemaining)
      }));
    } catch (err) {
      console.error("Error getting clue:", err);
      setError(err.response?.data?.message || 'Failed to get clue.');
    } finally {
      setLoadingClue(false);
    }
  };

  const handleForfeit = async () => {
    if (!gameState || gameState.isGameOver || loading) return;
    if (window.confirm("Are you sure you want to forfeit this game?")) {
      setLoading(true);
      setError('');
      try {
        const data = await gameService.forfeitGame(gameState._id);
        updateLocalGameState(data.game); // Update with the final game state
      } catch (err) {
        console.error("Error forfeiting game:", err);
        setError(err.response?.data?.message || 'Failed to forfeit game.');
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Word Info Handling ---
  const handleLearnMore = async () => {
      if (!gameState || !gameState.isGameOver || !gameState._id) return;

      setShowWordInfo(true); // Open the modal
      setWordInfo({ word: gameState.wordToGuess, info: '', loading: true, error: '' }); // Set loading state

      try {
          const data = await gameService.getWordInfo(gameState._id);
          setWordInfo({ word: data.word, info: data.info, loading: false, error: '' });
      } catch (err) {
          console.error("Error getting word info:", err);
          const errorMsg = err.response?.data?.message || 'Failed to load word information.';
          setWordInfo(prev => ({ ...prev, loading: false, error: errorMsg }));
      }
  };

  const handleCloseWordInfo = () => {
      setShowWordInfo(false);
      // Optionally reset wordInfo state here if preferred
      // setWordInfo({ word: '', info: '', loading: false, error: '' });
  };


  // --- Render Logic ---

  // Show setup screen if needed
  if (showSetup) {
    return (
      <div className="container mx-auto p-4 pt-8 max-w-3xl">
         {error && <p className="text-red-500 text-center mb-4 bg-red-100 p-2 rounded">{error}</p>}
        <GameSetup onStartGame={handleStartNewGame} loading={loading} />
      </div>
    );
  }

  // Show loading indicator while fetching initial game state
  if (loading && !gameState) return <div className="text-center mt-10">Loading Game...</div>;

  // Show error if loading failed and no game state
  if (error && !gameState) return <div className="text-center mt-10 text-red-500">{error} <button onClick={() => setShowSetup(true)} className="ml-2 px-3 py-1 bg-blue-500 text-white rounded">Go to Setup</button></div>;

  // If gameState is somehow null after loading/setup phase (shouldn't normally happen)
  if (!gameState) return <div className="text-center mt-10">Something went wrong. <button onClick={() => setShowSetup(true)} className="ml-2 px-3 py-1 bg-blue-500 text-white rounded">Go to Setup</button></div>;


  // --- Render Active or Game Over State ---
  const guessedLetters = gameState.guesses || [];
  const isGameOver = gameState.isGameOver;

  return (
    <div className="container mx-auto p-4 pt-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-2 text-indigo-800">AI Word Guess</h1>
      {/* Display Category and Difficulty */}
      <p className="text-center text-sm text-gray-600 mb-4">
        Category: <span className="font-medium capitalize">{gameState.category}</span> |
        Difficulty: <span className="font-medium capitalize">{gameState.difficulty}</span>
      </p>


      {error && <p className="text-red-500 text-center mb-4 bg-red-100 p-2 rounded">{error}</p>}

      <GameBoard
        wordDisplay={gameState.wordDisplay}
        incorrectGuesses={gameState.incorrectGuesses}
        maxIncorrectGuesses={gameState.maxIncorrectGuesses}
      />

      {/* Game Over Display */}
      {isGameOver && (
        <div className={`text-center p-4 rounded-lg shadow mb-6 font-bold text-xl ${gameState.isWon ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {gameState.isWon ? 'Congratulations, You Won!' : 'Game Over!'}
          <p className="text-lg mt-1">The word was: <strong className="uppercase font-semibold">{gameState.wordToGuess}</strong></p>
          {/* Learn More Button */}
          <button
            onClick={handleLearnMore}
            className="mt-3 px-4 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 transition duration-150"
            disabled={wordInfo.loading} // Disable while loading info
          >
            {wordInfo.loading ? 'Loading Info...' : `Learn More About "${gameState.wordToGuess}"`}
          </button>
        </div>
      )}

      {/* Keyboard (only if game is not over) */}
      {!isGameOver && (
        <Keyboard
          onGuess={handleGuess}
          guessedLetters={guessedLetters}
          disabled={loading} // Disable keyboard while processing guess/loading
        />
      )}

      {/* Clue Display */}
      <ClueDisplay
        clues={gameState.clues}
        cluesUsed={gameState.clues?.length || 0} // Pass current clue count
        maxCluesAllowed={gameState.maxCluesAllowed} // Pass max allowed
        onGetClue={handleGetClue}
        loadingClue={loadingClue}
        disabled={isGameOver || loading} // Disable if game over or general loading
      />

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={() => setShowSetup(true)} // Go back to setup to start a new game
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 transition duration-150"
          disabled={loading} // Disable if loading a guess/forfeit
        >
          Start New Game Setup
        </button>
        {!isGameOver && (
          <button
            onClick={handleForfeit}
            className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 transition duration-150"
            disabled={loading || isGameOver}
          >
            Forfeit Game
          </button>
        )}
      </div>

      {/* Word Info Modal */}
      {showWordInfo && (
          <WordInfoDisplay
              word={wordInfo.word}
              info={wordInfo.info}
              loading={wordInfo.loading}
              error={wordInfo.error}
              onClose={handleCloseWordInfo}
          />
      )}
    </div>
  );
};

export default GamePage;