// server/GameManager.js

class GameManager {
  constructor(roomCode) {
    this.players = new Map(); 
    this.roomCode = roomCode;
    this.MAX_PLAYERS = 6;
    
    // متغير لتخزين التايمر الخاص بالجولة الحالية
    this.roundTimer = null; 

    this.gameState = {
      roundIndex: 0,
      totalRounds: 5,
      currentQuestion: null,
      currentCategoryKey: null, // نحتاج نحفظ الفئة عشان البوت يختار منها
      fakeAnswers: new Map(),
      
      // 👇 خريطة جديدة لمعرفة نوع الإجابة (هل هي 'HUMAN' ولا 'BOT')
      answersType: new Map(), 
      
      votes: new Map(),
      whoFoundRealAnswer: new Set(),
      turnPlayerId: null,
      settings: {
        timePerRound: 45,
        selectedCategories: []
      }
    };
    
    this.lastActionTime = new Map();
  }

  addPlayer(id, username, avatarId, isHost) {
    if (this.players.size >= this.MAX_PLAYERS) throw new Error('الغرفة ممتلئة');
    this.players.set(id, { id, username: username.substring(0, 14), avatarId, score: 0, isHost });
  }

  removePlayer(id) {
    this.players.delete(id);
    this.lastActionTime.delete(id);
    if (this.players.size > 0) {
      const hasHost = [...this.players.values()].some(p => p.isHost);
      if (!hasHost) {
        const firstPlayer = this.players.keys().next().value;
        this.players.get(firstPlayer).isHost = true;
      }
    }
  }

  // دالة لطرد لاعب
  kickPlayer(playerId) {
    if (!this.players.has(playerId)) return false;
    this.removePlayer(playerId);
    return true;
  }

  getPlayer(id) { return this.players.get(id); }
  getAllPlayers() { return Array.from(this.players.values()); }

  canPerformAction(id) {
    const now = Date.now();
    const lastTime = this.lastActionTime.get(id) || 0;
    if (now - lastTime < 200) return false;
    this.lastActionTime.set(id, now);
    return true;
  }

  // 👇 [جديد] دالة لحفظ إجابة اللاعب وإرجاع قائمة اللي خلصوا
  submitFakeAnswer(playerId, answer) {
    // 1. حفظ الإجابة
    this.gameState.fakeAnswers.set(playerId, answer);
    this.gameState.answersType.set(playerId, 'HUMAN');


  
    // 2. إرجاع مصفوفة فيها كل الـ IDs للناس اللي جاوبت (عشان الفرونت يعرف يلونهم)
    return Array.from(this.gameState.fakeAnswers.keys());
  }


  // 👇 ضيف الدالة دي عشان التصويت
  submitVote(playerId, voteOption) {
    // 1. حفظ التصويت
    this.gameState.votes.set(playerId, voteOption);
    
    // 2. إرجاع قائمة الناس اللي صوتت حالاً
    return Array.from(this.gameState.votes.keys());
  }

  // دالة لمسح التايمر القديم
  clearRoundTimer() {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
  }

  resetGame() {
    this.clearRoundTimer(); // مسح التايمر عند إعادة اللعب
    this.gameState.roundIndex = 0;
    this.gameState.whoFoundRealAnswer.clear();
    this.players.forEach(p => p.score = 0);
  }
}


module.exports = GameManager;