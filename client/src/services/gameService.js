// src/services/gameService.js
import api from './api';

const startGame = async (category, difficulty) => {
  // Send category and difficulty in the request body
  const response = await api.post('/games/start', { category, difficulty });
  return response.data; // { message: "...", game: { ... } }
};

const getGameState = async (sessionId) => {
  const response = await api.get(`/games/${sessionId}`);
  return response.data; // { message, game: { ... } }
};

const submitGuess = async (sessionId, guess) => {
  const response = await api.post(`/games/${sessionId}/guess`, { guess });
  return response.data; // { message, game: { ... }, correctGuess }
};

const getClue = async (sessionId) => {
  const response = await api.get(`/games/${sessionId}/clue`);
  // Backend now sends: { message, clue, allClues, cluesRemaining }
  return response.data; // { message, clue, allClues }
};

const forfeitGame = async (sessionId) => {
    const response = await api.post(`/games/${sessionId}/end`);
    return response.data; // { message, game: { ... } }
}

// --- NEW Function ---
const getWordInfo = async (sessionId) => {
  const response = await api.get(`/games/${sessionId}/info`);
  // Backend sends: { message, word, info }
  return response.data;
}

export default {
  startGame,
  getGameState,
  submitGuess,
  getClue,
  forfeitGame,
  getWordInfo
};
