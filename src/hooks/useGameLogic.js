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

  // [핵심 수정 1] 레벨에 맞는 단어를 불러오는 함수
  const loadNewWord = useCallback(() => {
    // 확률 설정 가져오기
    const config = (LEVEL_CONFIG && LEVEL_CONFIG.find(c => level <= c.maxLevel)) || LEVEL_CONFIG[LEVEL_CONFIG.length - 1];
    
    // 단어 개수 뽑기 (확률 기반)
    const rand = Math.random() * 100; 
    let cumProb = 0; 
    let targetWordCount = 1;
    for (const [count, prob] of Object.entries(config.probs)) { 
        cumProb += prob; 
        if (rand < cumProb) { targetWordCount = Number(count); break; } 
    }
    
    // DB 선택
    let targetPool = wordDatabase;
    if (targetWordCount === 2) targetPool = twoWordDatabase; 
    else if (targetWordCount === 3) targetPool = threeWordDatabase; 
    else if (targetWordCount === 4) targetPool = fourWordDatabase; 
    else if (targetWordCount === 5) targetPool = fiveWordDatabase;
    
    // 레벨에 따른 고정 인덱스 (매직 넘버 활용)
    const magicNumber = 17; 
    const fixedIndex = ((level * magicNumber)) % targetPool.length; 
    const selectedPick = targetPool[fixedIndex] || wordDatabase[0];
    
    // 상태 업데이트
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
  }, [level]); // ★중요★ level이 바뀔 때만 이 함수가 재생성됨

  // [핵심 수정 2] 초기 실행 및 "레벨 변경 시" 자동 실행
  useEffect(() => {
    // 단어가 없거나, 레벨이 바뀌었을 때 실행
    loadNewWord();
  }, [level, loadNewWord]); 

  // 정답 체크 (변경 없음)
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

  // 힌트 처리 (변경 없음)
  const handleHint = () => {
    playSound('click'); if (isCorrect) return;
    const words = currentWord.split(' '); let cost = 0; let msg = ''; let nextStage = hintStage;
    
    if (hintStage === 0) { cost = 100; msg = `HINT: ${words.map(w => w[0].toUpperCase() + '...').join(' / ')}`; nextStage = 1; }
    else if (hintStage === 1) { cost = 200; msg = `HINT: ${words.map(w => w.length > 1 ? w[0].toUpperCase() + '...' + w[w.length-1].toUpperCase() : w[0]).join(' / ')}`; nextStage = 2; }
    else if (hintStage === 2) { cost = 300; msg = "WORD STRUCTURE REVEALED!"; nextStage = 3; }
    else { cost = 500; setIsFlashing(true); playSound('flash'); setTimeout(() => setIsFlashing(false), 500); return; }

    if (score >= cost) { setScore(s => s - cost); setHintStage(nextStage); if(msg) setHintMessage(msg); if(hintStage === 2) setMessage(msg); }
    else { setMessage(`Need ${cost} Points!`); setTimeout(() => setMessage(''), 1500); }
  };

  const handleShuffle = () => { playSound('click'); setScrambledLetters(prev => [...prev].sort(() => Math.random() - 0.5)); };
  const handleLetterClick = (l) => { playSound('click'); setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); };
  const handleReset = () => { playSound('click'); setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); };
  const handleBackspace = () => { if(selectedLetters.length > 0) { playSound('click'); const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(p => p.slice(0, -1)); setScrambledLetters(p => [...p, last]); } };

  // 자동 저장
  useEffect(() => {
    localStorage.setItem('word-game-current-word', currentWord); localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-word-type', wordType); localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
    localStorage.setItem('word-game-selected', JSON.stringify(selectedLetters)); localStorage.setItem('word-game-solved-data', JSON.stringify(solvedWordsData));
    localStorage.setItem('word-game-hint-stage', hintStage); localStorage.setItem('word-game-hint-message', hintMessage);
  }, [currentWord, category, wordType, scrambledLetters, selectedLetters, solvedWordsData, hintStage, hintMessage]);

  return {
    currentWord, category, wordType, scrambledLetters, selectedLetters, solvedWordsData, isCorrect, hintStage, hintMessage, isFlashing,
    setScrambledLetters, setSelectedLetters, setSolvedWordsData, setIsCorrect, setHintStage, setHintMessage, setCurrentWord,
    handleHint, handleShuffle, handleLetterClick, handleReset, handleBackspace, loadNewWord // loadNewWord 내보냄
  };
};
