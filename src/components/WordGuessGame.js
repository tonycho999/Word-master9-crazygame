import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle, X } from 'lucide-react';

// --- 확장된 데이터베이스 (설명 필드 추가) ---
const wordDatabase = [
  { word: 'APPLE', category: 'FRUIT', desc: 'A crunchy red fruit' },
  { word: 'TIGER', category: 'ANIMAL', desc: 'The king of the jungle with stripes' },
  { word: 'PIZZA', category: 'FOOD', desc: 'Italian dish with cheese and dough' },
  { word: 'BLUE DIAMOND', category: 'JEWEL', desc: 'A very rare and expensive blue gem' },
  { word: 'FAST CAR', category: 'VEHICLE', desc: 'A transportation that moves at high speed' },
  { word: 'POLAR BEAR', category: 'ANIMAL', desc: 'A large white bear living in the Arctic' },
  { word: 'HOT COFFEE', category: 'DRINK', desc: 'A steaming brown drink to wake you up' },
  { word: 'GREEN TEA', category: 'DRINK', desc: 'A healthy herbal tea with a light color' },
  { word: 'STARRY NIGHT', category: 'NATURE', desc: 'A sky filled with many shining stars' },
  { word: 'GOLD WATCH', category: 'FASHION', desc: 'A luxury item worn on the wrist to check time' }
];

const WordGuessGame = () => {
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 300);
  const [usedWordIds, setUsedWordIds] = useState(() => JSON.parse(localStorage.getItem('word-game-used-ids') || '[]'));
  const [currentWord, setCurrentWord] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState(''); // 설명 상태 추가
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [message, setMessage] = useState('');
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);

  // 로컬 스토리지 저장
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-ids', JSON.stringify(usedWordIds));
  }, [level, score, usedWordIds]);

  // 효과음 재생
  const playSound = (type) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'click') {
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.1);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + 0.4);
      });
    }
  };

  const loadNewWord = useCallback(() => {
    let avail = wordDatabase.filter(i => !usedWordIds.includes(i.word));
    if (avail.length === 0) avail = wordDatabase;
    const sel = avail[Math.floor(Math.random() * avail.length)];
    
    // 공백 제거 후 셔플
    const chars = sel.word.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, id: `l-${Date.now()}-${i}` 
    })).sort(() => Math.random() - 0.5);

    setCurrentWord(sel.word);
    setCategory(sel.category);
    setDescription(sel.desc);
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setIsCorrect(false);
    setHintLevel(0);
    setMessage('');
  }, [usedWordIds]);

  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);

  useEffect(() => {
    const combined = selectedLetters.map(l => l.char).join('').toUpperCase();
    const target = currentWord.replace(/\s/g, '').toUpperCase();
    if (combined === target && target.length > 0 && !isCorrect) {
      setIsCorrect(true);
      playSound('success');
      setMessage('EXCELLENT! 🎉');
    }
  }, [selectedLetters, currentWord, isCorrect]);

  const processNextLevel = () => {
    setScore(s => s + 50);
    setLevel(l => l + 1);
    setUsedWordIds(p => [...p, currentWord]);
    setCurrentWord('');
    setShowInterstitial(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans relative">
      {showInterstitial && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-10 text-white text-center">
          <button onClick={processNextLevel} className="absolute top-10 right-10"><X size={40}/></button>
          <div className="text-xl font-bold mb-4">ADVERTISEMENT</div>
          <div className="w-full max-w-sm aspect-video bg-gray-800 rounded-2xl mb-6 flex items-center justify-center italic text-gray-500">Sponsored Video...</div>
          <button onClick={processNextLevel} className="bg-white text-black px-10 py-4 rounded-full font-black">SKIP AD</button>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500">
        <div className="w-full flex justify-between items-center mb-6 font-black text-indigo-600">
          <span>LV {level}</span>
          <span className="flex items-center gap-1 text-gray-700"><Trophy size={18} className="text-yellow-500"/> {score}</span>
        </div>

        {/* 설명 및 카테고리 UI */}
        <div className="text-center mb-6">
          <span className="text-indigo-400 font-bold text-xs tracking-widest uppercase">{category}</span>
          <h2 className="text-2xl font-black text-gray-900 leading-tight mt-1">{description}</h2>
          {isCorrect && <div className="text-green-500 font-bold mt-2 animate-bounce">{message}</div>}
        </div>

        <div className="flex gap-2 mb-8">
          <button onClick={() => { playSound('click'); setScore(s => s - 100); setHintLevel(1); }} disabled={score < 100 || hintLevel > 0 || isCorrect} className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-tighter">
             {hintLevel > 0 ? currentWord[0] : 'Hint (-100)'}
          </button>
          <button onClick={() => { playSound('click'); setScrambledLetters(p => [...p].sort(() => Math.random() - 0.5)); }} className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-tighter">Shuffle</button>
          <button onClick={() => { setIsAdLoading(true); setTimeout(() => { setScore(s => s + 200); setIsAdLoading(false); playSound('success'); }, 3000); }} className="px-4 py-2 bg-amber-400 text-white rounded-full text-[10px] font-black shadow-sm"><PlayCircle size={12} className="inline mr-1"/>{isAdLoading ? '...' : 'FREE 200P'}</button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => { playSound('click'); setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); }} className="w-11 h-11 bg-white border-2 border-gray-100 rounded-xl font-black text-lg shadow-sm hover:border-indigo-400">{l.char.toUpperCase()}</button>
          ))}
        </div>

        <div className={`w-full min-h-[140px] rounded-[2rem] flex flex-col justify-center items-center p-6 mb-8 border-2 border-dashed ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedLetters.length === 0 ? <span className="text-gray-300 font-black uppercase text-[10px] tracking-widest">Select letters</span> : 
              selectedLetters.map(l => <span key={l.id} className={`text-3xl font-black ${isCorrect ? 'text-green-500' : 'text-indigo-600'}`}>{l.char.toUpperCase()}</span>)
            }
          </div>
        </div>

        <div className="w-full">
          {isCorrect ? (
            <button onClick={() => level % 10 === 0 ? setShowInterstitial(true) : processNextLevel()} className="w-full bg-green-500 text-white py-5 rounded-[2rem] font-black text-2xl shadow-lg animate-bounce flex items-center justify-center gap-2">NEXT LEVEL <ArrowRight size={28}/></button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => { setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); }} className="flex-1 bg-gray-50 py-5 rounded-[1.5rem] font-black text-gray-400">RESET</button>
              <button onClick={() => { if(selectedLetters.length > 0) { const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(p => p.slice(0, -1)); setScrambledLetters(p => [...p, last]); } }} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-2 shadow-xl"><Delete size={22}/> BACKSPACE</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
