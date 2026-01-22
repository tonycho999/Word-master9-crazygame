import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 0);
  const [usedWordIndices, setUsedWordIndices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('word-game-used-indices')) || []; } catch { return []; }
  });

  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [scrambledLetters, setScrambledLetters] = useState(() => {
    try { return JSON.parse(localStorage.getItem('word-game-scrambled')) || []; } catch { return []; }
  });

  const [selectedLetters, setSelectedLetters] = useState([]);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // 정답 단어 리스트 (예: ["lion", "tiger"])
  const targetWords = currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-indices', JSON.stringify(usedWordIndices));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
  }, [level, score, usedWordIndices, currentWord, category, scrambledLetters]);

  const loadNewWord = useCallback(() => {
    let db = level <= 19 ? wordDatabase : level <= 99 ? twoWordDatabase : threeWordDatabase;
    const dbKey = level <= 19 ? 's' : level <= 99 ? 'd' : 't';
    const available = db.map((_, i) => i).filter(i => !usedWordIndices.includes(`${dbKey}-${i}`));
    
    let targetIndex = available.length === 0 ? Math.floor(Math.random() * db.length) : available[Math.floor(Math.random() * available.length)];
    const wordObj = db[targetIndex];
    
    const chars = wordObj.word.replace(/\s/g, '').split('').map((char, i) => ({ char, id: Math.random() + i }));
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    setUsedWordIndices(prev => [...prev, `${dbKey}-${targetIndex}`]);
    setCurrentWord(wordObj.word);
    setCategory(wordObj.category);
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setMessage('');
    setIsCorrect(false);
    setShowHint(false);
  }, [level, usedWordIndices]);

  useEffect(() => {
    if (!currentWord || scrambledLetters.length === 0) loadNewWord();
  }, [currentWord, scrambledLetters.length, loadNewWord]);

  // 순서와 상관없이 정답 체크
  const checkGuess = () => {
    const userCombined = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correctCombined = currentWord.replace(/\s/g, '').toLowerCase();

    if (userCombined === correctCombined) {
      setMessage('EXCELLENT! 🎉');
      setIsCorrect(true);
      setTimeout(() => {
        setCurrentWord('');
        setScore(s => s + (level * 10));
        setLevel(l => l + 1);
      }, 1500);
    } else {
      setMessage('TRY AGAIN!');
    }
  };

  // 핵심 로직: 현재 입력된 글자들을 단어 덩어리로 분석하여 렌더링
  const renderDynamicWords = () => {
    let remainingSelected = [...selectedLetters];
    let displayRows = [];

    // 각 정답 단어 자리를 순회하며 매칭 시도
    targetWords.forEach((target, idx) => {
      const targetLen = target.length;
      // 현재 남은 선택 글자 중 이 단어 길이에 맞는 뭉치를 가져옴
      const chunk = remainingSelected.slice(0, targetLen);
      const chunkText = chunk.map(l => l.char).join('').toLowerCase();
      const isMatch = chunkText === target;

      displayRows.push(
        <div key={idx} className="flex flex-col items-center mb-6 last:mb-0 w-full">
          <div className="flex gap-2 items-center flex-wrap justify-center min-h-[40px]">
            {chunk.map((l) => (
              <span 
                key={l.id} 
                onClick={() => {
                  setSelectedLetters(prev => prev.filter(i => i.id !== l.id));
                  setScrambledLetters(prev => [...prev, l]);
                }} 
                className={`font-black cursor-pointer transition-all duration-300 ${
                  isMatch ? 'text-green-500 scale-110' : 'text-indigo-600'
                } ${targetLen > 8 ? 'text-2xl' : 'text-4xl'}`}
              >
                {l.char.toUpperCase()}
              </span>
            ))}
            {isMatch && <span className="text-green-500 font-bold ml-2">✓</span>}
          </div>
          <div className={`h-1.5 rounded-full mt-2 transition-all duration-500 ${isMatch ? 'bg-green-400 w-full' : 'bg-indigo-100 w-16'}`} />
        </div>
      );
      
      // 처리한 글자들은 제외
      remainingSelected = remainingSelected.slice(targetLen);
    });

    // 만약 단어 길이를 초과해서 더 입력된 글자가 있다면 하단에 추가 표시
    if (remainingSelected.length > 0) {
      displayRows.push(
        <div key="extra" className="flex gap-2 mt-4 opacity-50">
          {remainingSelected.map(l => (
            <span key={l.id} className="text-xl font-bold text-red-400">{l.char.toUpperCase()}</span>
          ))}
        </div>
      );
    }

    return displayRows;
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 font-bold text-indigo-600 uppercase">
            <Sparkles size={18} className="text-yellow-400" /> Level {level}
          </div>
          <div className="flex items-center gap-1 font-black text-gray-700">
            <Trophy size={18} className="text-yellow-500" /> {score}
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex flex-col items-center gap-1 mb-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{category}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-black text-white bg-indigo-500 px-3 py-1 rounded-full shadow-sm">
                {targetWords.length} {targetWords.length > 1 ? 'WORDS' : 'WORD'}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={() => setShowHint(!showHint)} className="px-4 py-2 bg-gray-50 border rounded-full text-xs font-bold hover:bg-gray-100 transition-colors">
              <Lightbulb size={14} className="inline mr-1"/>HINT
            </button>
            <button onClick={() => setScrambledLetters(prev => [...prev].sort(() => Math.random() - 0.5))} className="px-4 py-2 bg-gray-50 border rounded-full text-xs font-bold hover:bg-gray-100 transition-colors">
              <RotateCcw size={14} className="inline mr-1"/>SHUFFLE
            </button>
          </div>
          {showHint && (
            <div className="mt-3 p-2 bg-yellow-50 rounded-xl border border-yellow-100 text-xs text-yellow-700 font-bold">
              Starts with: <span className="text-indigo-600">{targetWords.map(w => w[0].toUpperCase() + "...").join(", ")}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8 min-h-[60px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => {
              setScrambledLetters(prev => prev.filter(i => i.id !== l.id));
              setSelectedLetters(prev => [...prev, l]);
              setMessage('');
            }} className="w-11 h-11 bg-white border-2 border-gray-100 rounded-xl font-bold text-lg shadow-sm active:scale-95 transition-all">
              {l.char.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="min-h-[160px] bg-indigo-50 rounded-2xl flex flex-col justify-center items-center p-6 mb-8 border-2 border-dashed border-indigo-200">
          {selectedLetters.length === 0 ? (
            <span className="text-indigo-200 text-sm font-bold uppercase tracking-widest text-center">Touch Letters to Answer</span>
          ) : (
            <div className="w-full">{renderDynamicWords()}</div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => {
            setScrambledLetters(prev => [...prev, ...selectedLetters]);
            setSelectedLetters([]);
            setMessage('');
          }} className="flex-1 bg-gray-50 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-100 transition-colors">RESET</button>
          <button onClick={checkGuess} disabled={selectedLetters.length === 0 || isCorrect} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:bg-green-500 transition-all hover:bg-indigo-700">
            {isCorrect ? 'PERFECT!' : 'CHECK'}
          </button>
        </div>
        
        {message && <div className="mt-4 text-center font-black text-indigo-600 tracking-widest uppercase animate-pulse">{message}</div>}
      </div>
    </div>
  );
};

export default WordGuessGame;
