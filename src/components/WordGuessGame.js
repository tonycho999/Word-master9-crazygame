import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Sparkles, Delete, ArrowRight, Lightbulb, RotateCcw } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 300);
  const [usedWordIds, setUsedWordIds] = useState(() => {
    try {
      const saved = localStorage.getItem('word-game-used-ids');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [scrambledLetters, setScrambledLetters] = useState(() => {
    try {
      const saved = localStorage.getItem('word-game-scrambled');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [selectedLetters, setSelectedLetters] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState('');

  const targetWords = useMemo(() => 
    currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  , [currentWord]);

  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-ids', JSON.stringify(usedWordIds));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
  }, [level, score, usedWordIds, currentWord, category, scrambledLetters]);

  const getWordTypeByLevel = useCallback((l) => {
    const r = Math.random() * 100;
    if (l >= 1 && l <= 5) return 1;
    if (l >= 6 && l <= 10) return l % 2 === 0 ? 2 : 1;
    if (l >= 11 && l <= 20) return 2;
    if (l >= 21 && l < 100) return (l >= 30 && r < 30) ? 1 : 2;
    if (l >= 100 && l <= 105) return 3;
    return r < 60 ? 3 : (r < 90 ? 2 : 1);
  }, []);

  const loadNewWord = useCallback(() => {
    const type = getWordTypeByLevel(level);
    let db = type === 1 ? wordDatabase : (type === 2 ? twoWordDatabase : threeWordDatabase);
    const prefix = `DB${type}`;
    let avail = db.filter(i => !usedWordIds.includes(`${prefix}-${i.word}`));
    if (avail.length === 0) avail = db;
    const sel = avail[Math.floor(Math.random() * avail.length)];
    const chars = sel.word.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, id: `l-${Date.now()}-${i}-${Math.random()}` 
    })).sort(() => Math.random() - 0.5);
    setUsedWordIds(p => [...p, `${prefix}-${sel.word}`]);
    setCurrentWord(sel.word);
    setCategory(sel.category);
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setIsCorrect(false);
    setShowHint(false);
    setMessage('');
  }, [level, usedWordIds, getWordTypeByLevel]);

  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);

  // 실시간 단어 매칭 및 렌더링 함수
  const renderFreeOrderWords = () => {
    let tempSelected = [...selectedLetters];
    let matchedWords = Array(targetWords.length).fill(null);
    let usedInMatch = new Set();

    targetWords.forEach((target, wordIdx) => {
      for (let i = 0; i <= tempSelected.length - target.length; i++) {
        const slice = tempSelected.slice(i, i + target.length);
        const sliceText = slice.map(l => l.char).join('').toLowerCase();
        if (sliceText === target) {
          matchedWords[wordIdx] = { letters: slice, isMatch: true };
          slice.forEach(l => usedInMatch.add(l.id));
          break;
        }
      }
    });

    let unmatchedLetters = selectedLetters.filter(l => !usedInMatch.has(l.id));
    
    return targetWords.map((target, idx) => {
      const isWordMatch = matchedWords[idx] !== null;
      const displayLetters = isWordMatch ? matchedWords[idx].letters : unmatchedLetters.splice(0, target.length);

      return (
        <div key={`word-${idx}`} className="flex flex-col items-center mb-4 last:mb-0">
          <div className="flex gap-1 items-center flex-wrap justify-center min-h-[40px]">
            {displayLetters.map((l) => (
              <span key={l.id} className={`text-3xl font-black transition-all ${isWordMatch ? 'text-green-500 scale-110' : 'text-indigo-600'}`}>
                {l.char.toUpperCase()}
              </span>
            ))}
            {isWordMatch && <span className="text-green-500 ml-2 font-bold text-xl">✓</span>}
          </div>
          <div className={`h-1.5 rounded-full mt-1 transition-all duration-500 ${isWordMatch ? 'bg-green-400 w-full' : 'bg-indigo-100 w-16'}`} />
        </div>
      );
    });
  };

  useEffect(() => {
    if (selectedLetters.length === 0 || !currentWord || isCorrect) return;
    const user = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correct = currentWord.replace(/\s/g, '').toLowerCase();
    if (user === correct) {
      setIsCorrect(true);
      setMessage('EXCELLENT! 🎉');
    }
  }, [selectedLetters, currentWord, isCorrect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500 mx-auto">
        <div className="w-full flex justify-between items-center mb-6 font-black text-indigo-600">
          <span className="flex items-center gap-1"><Sparkles size={18}/> LV {level}</span>
          <span className="flex items-center gap-1 text-gray-700"><Trophy size={18} className="text-yellow-500"/> {score}</span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-gray-900 uppercase mb-1">{category}</h2>
          <div className={`text-[11px] font-bold uppercase tracking-widest ${isCorrect ? 'text-green-500' : 'text-indigo-400'}`}>
            {message || (showHint ? `HINT: ${currentWord}` : `${targetWords.length} Word Challenge`)}
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button onClick={() => { if(score >= 100 && !showHint) { setScore(s => s - 100); setShowHint(true); } }} disabled={score < 100 || showHint || isCorrect} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all ${showHint ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500 hover:bg-yellow-50'}`}><Lightbulb size={14}/> HINT</button>
          <button onClick={() => !isCorrect && setScrambledLetters(p => [...p].sort(() => Math.random() - 0.5))} disabled={isCorrect} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-500 font-bold text-xs"><RotateCcw size={14}/> SHUFFLE</button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10 min-h-[64px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => { if(!isCorrect) { setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); setMessage(''); } }} className="w-11 h-11 bg-white border-2 border-gray-100 rounded-xl font-black text-lg shadow-sm active:scale-90 transition-all">{l.char.toUpperCase()}</button>
          ))}
        </div>

        <div className={`w-full min-h-[160px] rounded-[2rem] flex flex-col justify-center items-center p-6 mb-8 border-2 border-dashed transition-colors ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          {selectedLetters.length === 0 ? <span className="text-gray-300 font-bold uppercase text-xs">Tap Letters</span> : 
            <div className="w-full">{renderFreeOrderWords()}</div>
          }
        </div>

        <div className="w-full">
          {isCorrect ? (
            <button onClick={() => { setScore(s => s + (targetWords.length * 10)); setLevel(l => l + 1); setCurrentWord(''); }} className="w-full bg-green-500 text-white py-5 rounded-[2rem] font-black text-2xl shadow-lg animate-bounce flex items-center justify-center gap-2">NEXT LEVEL <ArrowRight size={28}/></button>
          ) : (
            <div className="flex gap-3 w-full">
              <button onClick={() => { setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); setMessage(''); }} className="flex-1 bg-gray-50 py-5 rounded-[1.5rem] font-black text-gray-400 text-sm border-2 border-gray-100">RESET</button>
              <button onClick={() => { if(selectedLetters.length > 0) { const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(p => p.slice(0, -1)); setScrambledLetters(p => [...p, last]); setMessage(''); } }} disabled={selectedLetters.length === 0} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-2"><Delete size={22}/> BACKSPACE</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
