import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Trophy, RotateCcw, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // 1. 초기값을 localStorage에서 가져오기 (없으면 기본값 사용)
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('word-game-level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem('word-game-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [usedWordIndices, setUsedWordIndices] = useState(() => {
    const saved = localStorage.getItem('word-game-used-indices');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentWord, setCurrentWord] = useState('');
  const [category, setCategory] = useState('');
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // 2. 데이터가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-indices', JSON.stringify(usedWordIndices));
  }, [level, score, usedWordIndices]);

  // 단어 섞기 함수
  const shuffleWord = useCallback((word) => {
    if (!word) return [];
    const chars = word.replace(/\s/g, '').split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.map((char, index) => ({ char, id: index }));
  }, []);

  // 랜덤 단어 선택 (중복 방지 포함)
  const getRandomWord = useCallback(() => {
    let db;
    if (level <= 19) db = wordDatabase;
    else if (level <= 99) db = twoWordDatabase;
    else db = threeWordDatabase;

    const dbKey = db === wordDatabase ? 's' : db === twoWordDatabase ? 'd' : 't';
    
    const availableIndices = db
      .map((_, index) => index)
      .filter(index => !usedWordIndices.includes(`${dbKey}-${index}`));

    let targetIndex;
    if (availableIndices.length === 0) {
      setUsedWordIndices([]); // 해당 구간 단어를 다 썼다면 초기화
      targetIndex = Math.floor(Math.random() * db.length);
    } else {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      targetIndex = availableIndices[randomIndex];
    }

    setUsedWordIndices(prev => [...prev, `${dbKey}-${targetIndex}`]);
    return db[targetIndex];
  }, [level, usedWordIndices]);

  // 레벨 초기화 및 새 단어 세팅
  useEffect(() => {
    if (!currentWord) {
      const wordObj = getRandomWord();
      if (wordObj) {
        setCurrentWord(wordObj.word);
        setCategory(wordObj.category);
        setScrambledLetters(shuffleWord(wordObj.word));
        setSelectedLetters([]);
        setMessage('');
        setIsCorrect(false);
        setShowHint(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, getRandomWord, shuffleWord]);

  // 글자 클릭 처리
  const handleLetterClick = (letter) => {
    setScrambledLetters(scrambledLetters.filter(l => l.id !== letter.id));
    setSelectedLetters([...selectedLetters, letter]);
    setMessage('');
  };

  // 선택된 글자 되돌리기
  const handleSelectedLetterClick = (letter) => {
    setSelectedLetters(selectedLetters.filter(l => l.id !== letter.id));
    setScrambledLetters(prev => [...prev, letter].sort((a, b) => a.id - b.id));
  };

  // 정답 확인
  const checkGuess = () => {
    const userAnswer = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correctAnswer = currentWord.replace(/\s/g, '').toLowerCase();

    if (userAnswer === correctAnswer) {
      setMessage('Correct! 🎉');
      setIsCorrect(true);
      setScore(prev => prev + level * 10);
      
      setTimeout(() => {
        if (level < 200) {
          setCurrentWord('');
          setLevel(prev => prev + 1);
        }
      }, 1500);
    } else {
      setMessage('Incorrect. Try again!');
      setIsCorrect(false);
    }
  };

  const resetAnswer = () => {
    const all = [...scrambledLetters, ...selectedLetters].sort((a, b) => a.id - b.id);
    setScrambledLetters(all);
    setSelectedLetters([]);
    setMessage('');
  };

  // 게임 완전 초기화 (필요시 호출)
  const restartGame = () => {
    if (window.confirm("모든 진행 상황을 초기화하고 레벨 1부터 다시 시작하시겠습니까?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 p-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
          <div>
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Level {level}</span>
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              <span className="text-xl font-black text-gray-800">{score}</span>
            </div>
          </div>
          <button onClick={restartGame} className="text-gray-400 hover:text-red-500 transition-colors" title="게임 초기화">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <span className="px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
              Category: {category}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {scrambledLetters.map((letter) => (
              <button
                key={letter.id}
                onClick={() => handleLetterClick(letter)}
                className="w-14 h-14 bg-white border-2 border-indigo-100 rounded-2xl text-2xl font-bold text-gray-700 shadow-sm hover:border-indigo-500 hover:scale-105 transition-all"
              >
                {letter.char.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="min-h-[80px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-wrap gap-3 justify-center items-center p-4 mb-6">
            {selectedLetters.length === 0 ? (
              <p className="text-gray-300">위의 글자를 터치하세요</p>
            ) : (
              selectedLetters.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => handleSelectedLetterClick(letter)}
                  className="w-14 h-14 bg-indigo-600 text-white rounded-2xl text-2xl font-bold shadow-lg animate-bounce"
                >
                  {letter.char.toUpperCase()}
                </button>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={resetAnswer} className="py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200">
              Reset
            </button>
            <button 
              onClick={checkGuess}
              disabled={selectedLetters.length === 0 || isCorrect}
              className="py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Check Answer
            </button>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-2xl text-center font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
