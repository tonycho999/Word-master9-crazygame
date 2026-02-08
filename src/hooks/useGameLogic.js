import { useState, useEffect, useCallback } from 'react';
// LEVEL_CONFIG는 이제 쓰지 않고, 직접 로직을 짰습니다.
import { wordDatabase, twoWordDatabase, threeWordDatabase, fourWordDatabase, fiveWordDatabase } from '../data/wordDatabase';

export const useGameLogic = (playSound, level, score, setScore, setMessage) => {
  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [wordType, setWordType] = useState(() => localStorage.getItem('word-game-word-type') || 'Normal');
  const [scrambledLetters, setScrambledLetters] = useState(() => JSON.parse(localStorage.getItem('word-game-scrambled')) || []);
  const [selectedLetters, setSelectedLetters] = useState(() => JSON.parse(localStorage.getItem('word-game-selected')) || []);
  const [solvedWords, setSolvedWords] = useState(() => JSON.parse(localStorage.getItem('word-game-solved-words')) || []);
  
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintStage, setHintStage] = useState(() => Number(localStorage.getItem('word-game-hint-stage')) || 0);
  const [hintMessage, setHintMessage] = useState(() => localStorage.getItem('word-game-hint-message') || '');
  const [isFlashing, setIsFlashing] = useState(false);

  // [핵심] 레벨별 단어 개수 패턴 로직
  const loadNewWord = useCallback(() => {
    
    let targetWordCount = 1;

    // ★ 요청하신 레벨별 패턴 설정
    if (level <= 5) {
      // 1 ~ 5: 1단어 고정
      targetWordCount = 1;
    } 
    else if (level <= 9) {
      // 6 ~ 9: 2단어 고정
      targetWordCount = 2;
    } 
    else if (level <= 19) {
      // 10 ~ 19: 1, 2 반복
      const pattern = [1, 2];
      targetWordCount = pattern[(level - 10) % pattern.length];
    } 
    else if (level <= 50) {
      // 20 ~ 50: 1, 2, 2, 3, 2, 2...
      const pattern = [1, 2, 2, 3, 2, 2];
      targetWordCount = pattern[(level - 20) % pattern.length];
    } 
    else if (level <= 100) {
      // 51 ~ 100: 1, 2, 3, 2, 3, 2, 3...
      const pattern = [1, 2, 3, 2, 3, 2, 3];
      targetWordCount = pattern[(level - 51) % pattern.length];
    } 
    else if (level <= 300) {
      // 101 ~ 300: 1, 2, 3, 4, 3, 3, 2...
      const pattern = [1, 2, 3, 4, 3, 3, 2];
      targetWordCount = pattern[(level - 101) % pattern.length];
    } 
    else if (level <= 700) {
      // 301 ~ 700: 2, 3, 2, 4, 3, 2, 3, 4...
      const pattern = [2, 3, 2, 4, 3, 2, 3, 4];
      targetWordCount = pattern[(level - 301) % pattern.length];
    } 
    else {
      // 701 이상: 2, 3, 4, 3, 4, 5, 4, 3...
      const pattern = [2, 3, 4, 3, 4, 5, 4, 3];
      targetWordCount = pattern[(level - 701) % pattern.length];
    }

    // 결정된 개수에 따라 DB 선택
    let targetPool = wordDatabase;
    if (targetWordCount === 2) targetPool = twoWordDatabase;
    else if (targetWordCount === 3) targetPool = threeWordDatabase;
    else if (targetWordCount === 4) targetPool = fourWordDatabase;
    else if (targetWordCount === 5) targetPool = fiveWordDatabase;

    // 해당 DB에서 순서대로 단어 가져오기
    const fixedIndex = (level - 1) % targetPool.length;
    const selectedPick = targetPool[fixedIndex] || targetPool[0];
    
    // 상태 초기화
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
    setHintStage(0);
    setHintMessage('');
    setIsFlashing(false);
    
    console.log(`🔒 [패턴 로드] Level: ${level}, Words: ${selectedPick.word.split(' ').length} (Target: ${targetWordCount})`);
  }, [level]);

  // 새로고침 시 유지
  useEffect(() => {
    if (!currentWord) {
      loadNewWord();
    }
  }, [level, loadNewWord, currentWord]); 

  // 정답 체크
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

  // 힌트 처리
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
        msg = ""; 
        nextStage = 3; 
    }
    else { 
        cost = 500; 
        setIsFlashing(true); 
        playSound('flash'); 
        setTimeout(() => setIsFlashing(false), 800); 
        return; 
    }

    if (score >= cost) { 
        setScore(s => s - cost); 
        setHintStage(nextStage); 
        if (msg) setHintMessage(msg); 
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
