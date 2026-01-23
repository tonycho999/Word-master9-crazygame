import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Sparkles, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle } from 'lucide-react';
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
  const [hintLevel, setHintLevel] = useState(0); // 0: 없음, 1: 첫글자, 2: 첫+끝글자
  const [message, setMessage] = useState('');
  const [isAdLoading, setIsAdLoading] = useState(false);

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

  // --- 힌트 텍스트 생성 로직 ---
  const hintDisplay = useMemo(() => {
    if (hintLevel === 0) return null;
    return targetWords.map(word => {
      if (hintLevel === 1) return word[0].toUpperCase() + '...';
      if (hintLevel === 2) {
        return word.length > 1 
          ? word[0].toUpperCase() + '...' + word[word.length - 1].toUpperCase() 
          : word[0].toUpperCase();
      }
      return '';
    }).join(' ');
  }, [targetWords, hintLevel]);

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
    setHintLevel(0); // 힌트 초기화
    setMessage('');
  }, [level, usedWordIds, getWordTypeByLevel]);

  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);

  const handleHint = () => {
    if (isCorrect || hintLevel >= 2) return;

    if (hintLevel === 0 && score >= 100) {
      setScore(prev => prev - 100);
      setHintLevel(1);
    } else if (hintLevel === 1 && score >= 50) {
      setScore(prev => prev - 50);
      setHintLevel(2);
    }
  };

  const { renderedComponents, allMatched } = useMemo(() => {
    let tempSelected = [...selectedLetters];
    let matchedCount = 0;
    let usedInMatch = new Set();
    const wordResults = targetWords.map((target) => {
      let matchInfo = null;
      for (let i = 0; i <= tempSelected.length - target.length; i++) {
        const slice = tempSelected.slice(i, i + target.length);
        const sliceText = slice.map(l => l.char).join('').toLowerCase();
        if (sliceText === target) {
          matchInfo = { letters: slice, isMatch: true };
          slice.forEach(l => usedInMatch.add(l.id));
          matchedCount++;
          break;
        }
      }
      return { target, matchInfo };
    });
    let unmatchedLetters = selectedLetters.filter(l => !usedInMatch.has(l.id));
    const components = wordResults.map((res, idx) => {
      const isWordMatch = res.matchInfo !== null;
      const displayLetters = isWordMatch ? res.matchInfo.letters : unmatchedLetters.splice(0, res.target.length);
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
    return { renderedComponents: components, allMatched: matchedCount === targetWords.length && selectedLetters.length === currentWord.replace(/\s/g, '').length };
  }, [selectedLetters, targetWords, currentWord]);

  useEffect(() => {
    if (allMatched && !isCorrect) {
      setIsCorrect(true);
      setMessage('EXCELLENT! 🎉');
    }
  }, [allMatched, isCorrect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500 mx-auto text-center">
        
        <div className="w-full flex justify-between items-center mb-6 font-black text-indigo-600">
          <span className="flex items-center gap-1 text-lg"><Sparkles size={18}/> LV {level}</span>
          <span className="flex items-center gap-1 text-lg text-gray-700"><Trophy size={18} className="text-yellow-500"/> {score}</span>
        </div>

        <h2 className="text-3xl font-black text-gray-900 uppercase mb-1 tracking-tighter">{category}</h2>
        <div className={`text-[12px] font-black uppercase tracking-widest min-h-[1.5rem] mb-6 ${isCorrect ? 'text-green-500' : 'text-indigo-400'}`}>
          {message || (hintLevel > 0 ? `HINT: ${hintDisplay}` : `${targetWords.length} Word Challenge`)}
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button 
            onClick={handleHint} 
            disabled={isCorrect || hintLevel >= 2 || (hintLevel === 0 && score < 100) || (hintLevel === 1 && score < 50)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-[10px] transition-all ${hintLevel >= 2 ? 'bg-gray-100 text-gray-400' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
          >
            <Lightbulb size={12}/> {hintLevel === 0 ? 'HINT 1 (-100)' : hintLevel === 1 ? 'HINT 2 (-50)' : 'MAX HINT'}
          </button>
          
          <button onClick={() => !isCorrect && setScrambledLetters(p => [...p].sort(() => Math.random() - 0.5))} disabled={isCorrect} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-500 font-black text-[10px] hover:bg-indigo-50"><RotateCcw size={12}/> SHUFFLE</button>
          
          <button 
            onClick={() => { if(!isAdLoading) { setIsAdLoading(true); setMessage('광고 시청 중... (5초)'); setTimeout(() => { setScore(p => p + 200); setIsAdLoading(false); setMessage('200P 획득! 🎁'); setTimeout(() => setMessage(''), 2000); }, 5000); } }} 
            disabled={isAdLoading || isCorrect} 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400 text-white font-black text-[10px] hover:bg-amber-500 shadow-sm"
          >
            <PlayCircle size={12}/> {isAdLoading ? 'WATCHING...' : '+ 200P (AD)'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10 min-h-[64px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => { if(!isCorrect) { setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); setMessage(''); } }} className="w-11 h-11 bg-white border-2 border-gray-100 rounded-xl font-black text-lg shadow-sm active:scale-90">{l.char.toUpperCase()}</button>
          ))}
        </div>

        <div className={`w-full min-h-[160px] rounded-[2rem] flex flex-col justify-center items-center p-6 mb-8 border-2 border-dashed transition-all ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          {selectedLetters.length === 0 ? <span className="text-gray-300 font-black uppercase text-[10px] tracking-widest">Select letters</span> : <div className="w-full">{renderedComponents}</div>}
        </div>

        <div className="w-full">
          {isCorrect ? (
            <button onClick={() => { setScore(s => s + (targetWords.length * 10)); setLevel(l => l + 1); setCurrentWord(''); }} className="w-full bg-green-500 text-white py-5 rounded-[2rem] font-black text-2xl shadow-lg animate-bounce flex items-center justify-center gap-2">NEXT LEVEL <ArrowRight size={28}/></button>
          ) : (
            <div className="flex gap-3 w-full">
              <button onClick={() => { setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); setMessage(''); }} className="flex-1 bg-gray-50 py-5 rounded-[1.5rem] font-black text-gray-400 text-xs border-2 border-gray-100">RESET</button>
              <button onClick={() => { if(selectedLetters.length > 0) { const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(p => p.slice(0, -1)); setScrambledLetters(p => [...p, last]); setMessage(''); } }} disabled={selectedLetters.length === 0} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-2 shadow-xl"><Delete size={22}/> BACKSPACE</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
