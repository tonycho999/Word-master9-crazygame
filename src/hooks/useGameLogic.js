import { useState, useEffect, useCallback } from 'react';
import { wordDatabase, twoWordDatabase, threeWordDatabase, fourWordDatabase, fiveWordDatabase } from '../data/wordDatabase';

export const useGameLogic = (playSound, level, score, setScore, setMessage) => {
  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [wordType, setWordType] = useState(() => localStorage.getItem('word-game-word-type') || 'Normal');
  const [scrambledLetters, setScrambledLetters] = useState(() => JSON.parse(localStorage.getItem('word-game-scrambled')) || []);
  const [selectedLetters, setSelectedLetters] = useState(() => JSON.parse(localStorage.getItem('word-game-selected')) || []);
  
  // 맞춘 단어 목록 (예: ["APPLE", "RED"])
  const [solvedWords, setSolvedWords] = useState(() => JSON.parse(localStorage.getItem('word-game-solved-words')) || []);
  
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintStage, setHintStage] = useState(() => Number(localStorage.getItem('word-game-hint-stage')) || 0);
  const [hintMessage, setHintMessage] = useState(() => localStorage.getItem('word-game-hint-message') || '');
  const [isFlashing, setIsFlashing] = useState(false);

  // [핵심 1] 레벨별 고정 단어 로드
  const loadNewWord = useCallback(() => {
    // 1. 모든 단어 DB 합치기
    const allWords = [
      ...wordDatabase,
      ...twoWordDatabase,
      ...threeWordDatabase,
      ...fourWordDatabase,
      ...fiveWordDatabase
    ];

    // 2. 레벨에 따른 인덱스 계산
    const fixedIndex = (level - 1) % allWords.length;
    const selectedPick = allWords[fixedIndex];
    
    // 3. 상태 초기화
    setCurrentWord(selectedPick.word);
    setCategory(selectedPick.category);
    setWordType(selectedPick.type ? selectedPick.type.toUpperCase() : 'NORMAL');
    
    // 알파벳 섞기
    const chars = selectedPick.word.replace(/\s/g, '')
      .split('')
      .map((char, i) => ({ char, id: `l-${Date.now()}-${i}-${Math.random()}` }))
      .sort(() => Math.random() - 0.5);
    
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setSolvedWords([]); 
    setIsCorrect(false);
    setHintStage(0); // ★ 여기서 힌트가 초기화됨
    setHintMessage('');
    setIsFlashing(false);
    
    console.log(`🔒 [고정 단어 로드] Level: ${level}, Word: ${selectedPick.word}`);
  }, [level]);

  // [핵심 수정] 초기 실행 로직 변경
  useEffect(() => {
    // ★ 이미 단어가 로드되어 있다면(새로고침 등), 초기화(loadNewWord)를 하지 않음
    if (!currentWord) {
      loadNewWord();
    }
  }, [level, loadNewWord, currentWord]); 

  // 정답 체크 로직
  useEffect(() => {
    if (!currentWord) return;

    const enteredStr = selectedLetters.map(l => l.char).join('').toUpperCase();
    const targetWords = currentWord.toUpperCase().split(' ');
    const alreadySolved = solvedWords.map(w => w.toUpperCase());

    const matchedWord = targetWords.find(word => word === enteredStr && !alreadySolved.includes(word));

    if (matchedWord) {
      const newSolvedWords = [...solvedWords, matchedWord];
      setSolvedWords(newSolvedWords);
      setSelectedLetters([]);
      playSound('partialSuccess');
      
      const allCleared = targetWords.every(t => newSolvedWords.includes(t));
      if (allCleared) {
        setIsCorrect(true);
        playSound('allSuccess');
      }
    }
  }, [selectedLetters, currentWord, solvedWords, playSound]);

  // 힌트 처리 함수
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
        msg = ""; // 3단계: 메시지 없음
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
        
        if (msg) {
            setHintMessage(msg); 
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

  // 자동 저장
  useEffect(() => {
    localStorage.setItem('word-game-current-word', currentWord); 
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-word-type', wordType); 
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
    localStorage.setItem('word-game-selected', JSON.stringify(selectedLetters)); 
    localStorage.setItem('word-game-solved-words', JSON.stringify(solvedWords)); 
    localStorage.setItem('word-game-hint-stage', hintStage); 
    localStorage.setItem('word-game-hint-message', hintMessage);
  }, [currentWord, category, wordType, scrambledLetters, selectedLetters, solvedWords, hintStage, hintMessage]);

  return {
    currentWord, category, wordType, scrambledLetters, selectedLetters, 
    solvedWords,
    isCorrect, hintStage, hintMessage, isFlashing,
    setScrambledLetters, setSelectedLetters, 
    setSolvedWords,
    setIsCorrect, setHintStage, setHintMessage, setCurrentWord,
    handleHint, handleShuffle, handleLetterClick, handleReset, handleBackspace, loadNewWord
  };
};
