import { useState, useEffect, useCallback } from 'react';
import { wordDatabase, twoWordDatabase, threeWordDatabase, fourWordDatabase, fiveWordDatabase, LEVEL_CONFIG } from '../data/wordDatabase';

export const useGameLogic = (playSound, level, score, setScore, setMessage) => {
  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [wordType, setWordType] = useState(() => localStorage.getItem('word-game-word-type') || 'Normal');
  const [scrambledLetters, setScrambledLetters] = useState(() => JSON.parse(localStorage.getItem('word-game-scrambled')) || []);
  const [selectedLetters, setSelectedLetters] = useState(() => JSON.parse(localStorage.getItem('word-game-selected')) || []);
  const [solvedWordsData, setSolvedWordsData] = useState(() => JSON.parse(localStorage.getItem('word-game-solved-data')) || []);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintStage, setHintStage] = useState(() => Number(localStorage.getItem('word-game-hint-stage')) || 0);
  const [hintMessage, setHintMessage] = useState(() => localStorage.getItem('word-game-hint-message') || '');
  const [isFlashing, setIsFlashing] = useState(false);

  // 레벨에 맞는 단어를 불러오는 함수
  const loadNewWord = useCallback(() => {
    const config = (LEVEL_CONFIG && LEVEL_CONFIG.find(c => level <= c.maxLevel)) || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
    
    const rand = Math.random() * 100; 
    let cumProb = 0; 
    let targetWordCount = 1;
    for (const [count, prob] of Object.entries(config.probs)) { 
        cumProb += prob; 
        if (rand < cumProb) { targetWordCount = Number(count); break; } 
    }
    
    let targetPool = wordDatabase;
    if (targetWordCount === 2) targetPool = twoWordDatabase; 
    else if (targetWordCount === 3) targetPool = threeWordDatabase; 
    else if (targetWordCount === 4) targetPool = fourWordDatabase; 
    else if (targetWordCount === 5) targetPool = fiveWordDatabase;
    
    const magicNumber = 17; 
    const fixedIndex = ((level * magicNumber)) % targetPool.length; 
    const selectedPick = targetPool[fixedIndex] || wordDatabase[0];
    
    setCurrentWord(selectedPick.word); 
    setCategory(selectedPick.category); 
    setWordType(selectedPick.type ? selectedPick.type.toUpperCase() : 'NORMAL');
    
    const chars = selectedPick.word.replace(/\s/g, '').split('').map((char, i) => ({ char, id: `l-${Date.now()}-${i}-${Math.random()}` })).sort(() => Math.random() - 0.5);
    
    setScrambledLetters(chars); 
    setSelectedLetters([]); 
    setSolvedWordsData([]); 
    setIsCorrect(false); 
    setHintStage(0); 
    setHintMessage(''); 
    setIsFlashing(false);
    
    console.log(`🆕 [새 단어 로드] Level: ${level}, Word: ${selectedPick.word}`);
  }, [level]);

  useEffect(() => {
    loadNewWord();
  }, [level, loadNewWord]); 

  useEffect(() => {
    if (!currentWord) return;
    const enteredStr = selectedLetters.map(l => l.char).join('').toUpperCase();
    const targetWords = currentWord.toUpperCase().split(' ');
    const alreadySolvedWords = solvedWordsData.map(data => data.word.toUpperCase());
    
    const matchIndex = targetWords.findIndex(word => word === enteredStr && !alreadySolvedWords.includes(word));
    if (matchIndex !== -1) {
      const matchedWord = targetWords[matchIndex];
      const newSolvedData = [...solvedWordsData, { word: matchedWord, letters: [...selectedLetters] }];
      setSolvedWordsData(newSolvedData); setSelectedLetters([]); playSound('partialSuccess');
      if (newSolvedData.length === targetWords.length) { setIsCorrect(true); playSound('allSuccess'); }
    }
  }, [selectedLetters, currentWord, solvedWordsData, playSound]);

  // [수정된 부분] 힌트 처리 함수
  const handleHint = () => {
    playSound('click'); 
    if (isCorrect) return;

    const words = currentWord.split(' '); 
    let cost = 0; 
    let msg = ''; 
    let nextStage = hintStage;
    
    if (hintStage === 0) { 
        cost = 100; 
        msg = `HINT: ${words.map(w => w[0].toUpperCase() + '...').join(' / ')}`; 
        nextStage = 1; 
    }
    else if (hintStage === 1) { 
        cost = 200; 
        msg = `HINT: ${words.map(w => w.length > 1 ? w[0].toUpperCase() + '...' + w[w.length-1].toUpperCase() : w[0]).join(' / ')}`; 
        nextStage = 2; 
    }
    else if (hintStage === 2) { 
        cost = 300; 
        msg = ""; // [수정] 메시지를 비워둠 ("WORD STRUCTURE REVEALED!" 제거)
        nextStage = 3; 
    }
    else { 
        cost = 500; 
        setIsFlashing(true); 
        playSound('flash'); 
        setTimeout(() => setIsFlashing(false), 500); 
        return; 
    }

    if (score >= cost) { 
        setScore(s => s - cost); 
        setHintStage(nextStage); 
        
        // [수정] msg가 있을 때만 힌트 메시지 업데이트 및 알림 표시
        if (msg) {
            setHintMessage(msg); 
            // 2단계(3번째 힌트)에서는 msg가 비어있으므로 setMessage가 실행되지 않음
            if (hintStage !== 2) setMessage(msg); 
        }
    }
    else { 
        setMessage(`Need ${cost} Points!`); 
        setTimeout(() => setMessage(''), 1500); 
    }
  };

  const handleShuffle = () => { playSound('click'); setScrambledLetters(prev => [...prev].sort(() => Math.random() - 0.5)); };
  const handleLetterClick = (l) => { playSound('click'); setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); };
  const handleReset = () => { playSound('click'); setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); };
  const handleBackspace = () => { if(selectedLetters.length > 0) { playSound('click'); const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(p => p.slice(0, -1)); setScrambledLetters(p => [...p, last]); } };

  useEffect(() => {
    localStorage.setItem('word-game-current-word', currentWord); localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-word-type', wordType); localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
    localStorage.setItem('word-game-selected', JSON.stringify(selectedLetters)); localStorage.setItem('word-game-solved-data', JSON.stringify(solvedWordsData));
    localStorage.setItem('word-game-hint-stage', hintStage); localStorage.setItem('word-game-hint-message', hintMessage);
  }, [currentWord, category, wordType, scrambledLetters, selectedLetters, solvedWordsData, hintStage, hintMessage]);

  return {
    currentWord, category, wordType, scrambledLetters, selectedLetters, solvedWordsData, isCorrect, hintStage, hintMessage, isFlashing,
    setScrambledLetters, setSelectedLetters, setSolvedWordsData, setIsCorrect, setHintStage, setHintMessage, setCurrentWord,
    handleHint, handleShuffle, handleLetterClick, handleReset, handleBackspace, loadNewWord
  };
};
