import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, RotateCcw, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  const [level, setLevel] = useState(1);
  const [currentWord, setCurrentWord] = useState('');
  const [category, setCategory] = useState('');
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // 랜덤 단어 선택
  const getRandomWord = () => {
    if (level <= 19) {
      // 1-19 레벨: 1단어
      const index = Math.floor(Math.random() * wordDatabase.length);
      return wordDatabase[index];
    } else if (level <= 99) {
      // 20-99 레벨: 2단어
      const index = Math.floor(Math.random() * twoWordDatabase.length);
      return twoWordDatabase[index];
    } else {
      // 100-200 레벨: 3단어
      const index = Math.floor(Math.random() * threeWordDatabase.length);
      return threeWordDatabase[index];
    }
  };

  // 단어 섞기
  const shuffleWord = (word) => {
    const chars = word.replace(/\s/g, '').split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.map((char, index) => ({ char, id: index }));
  };

  // 레벨 초기화
  useEffect(() => {
    const wordObj = getRandomWord();
    setCurrentWord(wordObj.word);
    setCategory(wordObj.category);
    setScrambledLetters(shuffleWord(wordObj.word));
    setSelectedLetters([]);
    setMessage('');
    setIsCorrect(false);
    setShowHint(false);
  }, [level]);

  // 글자 클릭 처리
  const handleLetterClick = (letter) => {
    setScrambledLetters(scrambledLetters.filter(l => l.id !== letter.id));
    setSelectedLetters([...selectedLetters, letter]);
    setMessage('');
  };

  // 선택된 글자 클릭 처리 (되돌리기)
  const handleSelectedLetterClick = (letter) => {
    setSelectedLetters(selectedLetters.filter(l => l.id !== letter.id));
    setScrambledLetters([...scrambledLetters, letter]);
  };

  // 리셋
  const resetAnswer = () => {
    setScrambledLetters([...scrambledLetters, ...selectedLetters].sort((a, b) => a.id - b.id));
    setSelectedLetters([]);
    setMessage('');
  };

  // 글자 섞기 (다시 셔플)
  const shuffleLetters = () => {
    const allLetters = [...scrambledLetters, ...selectedLetters];
    const shuffled = [...allLetters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setScrambledLetters(shuffled);
    setSelectedLetters([]);
    setMessage('');
  };

  // 정답 확인
  const checkGuess = () => {
    const userAnswer = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correctAnswer = currentWord.replace(/\s/g, '').toLowerCase();

    if (userAnswer === correctAnswer) {
      setMessage('Correct! 🎉');
      setIsCorrect(true);
      setScore(score + level * 10);
      
      setTimeout(() => {
        if (level < 200) {
          setLevel(level + 1);
        } else {
          setMessage('Congratulations! You completed all levels! 🏆');
        }
      }, 1500);
    } else {
      setMessage('Incorrect. Try again!');
      setIsCorrect(false);
    }
  };

  // 힌트 보기
  const toggleHint = () => {
    setShowHint(!showHint);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="text-yellow-500" size={32} />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Word Scramble Game
              </h1>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-2xl font-bold text-lg">
                Level {level}
              </div>
              <div className="flex items-center gap-2 bg-yellow-100 px-4 py-3 rounded-2xl">
                <Trophy className="text-yellow-600" size={20} />
                <span className="font-bold text-yellow-700">{score}</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {level <= 19 ? '1 word' : level <= 99 ? '2 words' : '3 words'}
            </div>
          </div>
        </div>

        {/* 게임 영역 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* 카테고리 */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-2 rounded-full">
              <p className="text-purple-700 font-semibold">Category: {category}</p>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={shuffleLetters}
                className="p-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 transition-colors"
                title="Shuffle letters"
              >
                <RotateCcw size={20} className="text-purple-600" />
              </button>
            </div>
          </div>

          {/* 힌트 버튼 */}
          <div className="mb-6 text-center">
            <button
              onClick={toggleHint}
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Lightbulb size={18} />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
            {showHint && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <p className="text-gray-700">
                  Starts with: <span className="font-bold text-yellow-700">{currentWord[0].toUpperCase()}</span>
                </p>
                <p className="text-gray-700 mt-1">
                  Length: <span className="font-bold text-yellow-700">{currentWord.replace(/\s/g, '').length} letters</span>
                </p>
              </div>
            )}
          </div>

          {/* 섞인 글자들 */}
          <div className="mb-8">
            <p className="text-center text-gray-600 mb-4 font-medium">Tap the letters</p>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 min-h-24 flex flex-wrap gap-2 justify-center items-center">
              {scrambledLetters.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => handleLetterClick(letter)}
                  className="bg-white text-gray-800 font-bold text-2xl w-14 h-14 rounded-xl shadow-md hover:shadow-lg hover:scale-110 transition-all border-2 border-indigo-200 hover:border-indigo-400"
                >
                  {letter.char.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 답변 영역 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-600 font-medium">Your Answer</p>
              <button
                onClick={resetAnswer}
                className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 min-h-24 flex flex-wrap gap-2 justify-center items-center border-2 border-green-200">
              {selectedLetters.length === 0 ? (
                <p className="text-gray-400">Tap letters above...</p>
              ) : (
                selectedLetters.map((letter) => (
                  <button
                    key={letter.id}
                    onClick={() => handleSelectedLetterClick(letter)}
                    className="bg-white text-gray-800 font-bold text-2xl w-14 h-14 rounded-xl shadow-md hover:shadow-lg hover:scale-110 transition-all border-2 border-green-300 hover:border-green-500"
                  >
                    {letter.char.toUpperCase()}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 확인 버튼 */}
          <button
            onClick={checkGuess}
            disabled={selectedLetters.length === 0}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Check Answer
          </button>

          {/* 메시지 */}
          {message && (
            <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${
              isCorrect 
                ? 'bg-green-50 text-green-700 border-2 border-green-200' 
                : 'bg-red-50 text-red-700 border-2 border-red-200'
            }`}>
              {isCorrect ? (
                <CheckCircle size={24} />
              ) : (
                <XCircle size={24} />
              )}
              <p className="font-medium">{message}</p>
            </div>
          )}

          {/* 레벨 200 완료 메시지 */}
          {level === 200 && isCorrect && (
            <div className="mt-6 p-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl text-center">
              <Trophy size={48} className="mx-auto mb-3 text-white" />
              <p className="text-white font-bold text-xl">
                All Levels Cleared! Congratulations! 🎊
              </p>
              <p className="text-white mt-2">Final Score: {score}</p>
            </div>
          )}
        </div>

        {/* 게임 설명 */}
        <div className="mt-6 bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 text-white">
          <h3 className="font-bold mb-2">How to Play</h3>
          <ul className="text-sm space-y-1 opacity-90">
            <li>• Tap the scrambled letters to form the correct word</li>
            <li>• Use the category hint to help you guess</li>
            <li>• Tap letters in the answer area to remove them</li>
            <li>• Press Reset to start over with the same word</li>
            <li>• Complete all 200 levels to win!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
