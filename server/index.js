const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./GameManager');
const { log } = require('./logger');
const path = require('path');

// 👇👇👇 هذا السطر هو الأهم! لازم يكون هنا قبل أي app.use 👇👇👇
const app = express(); 

app.use(cors());

// الآن الكود سيعمل لأن app تم تعريفه خلاص
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ... كمل باقي الكود (const server = http.createServer(app); ... إلخ)
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const games = new Map(); 
const socketToRoom = new Map(); 

// معالجة الأسئلة وإضافة IDs
let allQuestionsWithIds = {}; 
let globalIdCounter = 1;

// 👇 التعديل 1: استخدام questionsDB بدلاً من questionsData
for (const [category, questions] of Object.entries(questionsDB)) {
  allQuestionsWithIds[category] = questions.map(q => ({
    ...q, text: q.text || q.q || "سؤال فارغ", id: q.id || `gen_${globalIdCounter++}` 
  }));
}

// 👇 التعديل 2: دالة الحماية (تمنع السيرفر من الوقوع)
const getUniqueQuestion = (categoryKey, excludeIds, roomUsedIds) => {
  // 1. محاولة جلب الفئة المطلوبة
  let categoryQuestions = allQuestionsWithIds[categoryKey];

  // 2. لو مش موجودة، نحاول نجيب general
  if (!categoryQuestions) {
      console.log(`⚠️ Warning: Category "${categoryKey}" missing. Trying 'general'.`);
      categoryQuestions = allQuestionsWithIds['general'];
  }

  // 3. لو مفيش فايدة (ولا الفئة ولا general موجودين)، نرجع null عشان السيرفر ميقعش
  if (!categoryQuestions) {
      console.log(`❌ CRITICAL: No questions found for "${categoryKey}" or "general"`);
      return null;
  }

  // الفلترة: استبعد الأسئلة الموجودة في (تاريخ المتصفح + تاريخ الجيم الحالي)
  const available = categoryQuestions.filter(q => 
    !excludeIds.includes(q.id) && !roomUsedIds.includes(q.id)
  );

  // لو كل الأسئلة خلصت؟ نختار من اللي لم يستخدم في الجيم الحالي فقط
  if (available.length === 0) {
    const resetAvailable = categoryQuestions.filter(q => !roomUsedIds.includes(q.id));
    if (resetAvailable.length === 0) return null; // خلصوا خالص
    return resetAvailable[Math.floor(Math.random() * resetAvailable.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
};

const getGame = (socketId) => {
  const roomCode = socketToRoom.get(socketId);
  if (!roomCode) return null;
  return games.get(roomCode);
};

const generateRoomCode = () => {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (games.has(code)); 
  return code;
};

io.on('connection', (socket) => {
  log(`User Connected: ${socket.id}`, 'INFO');

  const safeHandler = (handler) => {
    return (...args) => {
      try {
        const game = getGame(socket.id);
        if (!game && handler.name !== 'handleCreate' && handler.name !== 'handleJoin') return;
        if (game && !game.canPerformAction(socket.id)) return;
        handler(...args, game); 
      } catch (err) {
        log(`Error: ${err.message}`, 'ERROR');
        socket.emit('error_msg', 'حدث خطأ غير متوقع');
      }
    };
  };

  // 1. إنشاء اللعبة
  socket.on('create_game', safeHandler(function handleCreate(data) {
    const roomCode = generateRoomCode();
    const newGame = new GameManager(roomCode);
    newGame.addPlayer(socket.id, data.username, data.avatarId, true);
    
    newGame.gameState.totalRounds = 10;
    
    games.set(roomCode, newGame);
    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);
    
    socket.emit('room_created', { code: roomCode });
    socket.emit('join_success', { isHost: true, players: newGame.getAllPlayers() });
    
    io.to(roomCode).emit('update_players', newGame.getAllPlayers());
    io.to(roomCode).emit('settings_update', newGame.gameState.settings);
  }));

  socket.on('join_game', safeHandler(function handleJoin(data) {
    const roomCode = data.codeInput;
    const game = games.get(roomCode);
    if (!game) throw new Error('الكود غير صحيح');
    game.addPlayer(socket.id, data.username, data.avatarId, false);
    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);
    socket.emit('room_info', { code: roomCode });
    socket.emit('join_success', { isHost: false, players: game.getAllPlayers() });
    io.to(roomCode).emit('update_players', game.getAllPlayers());
    io.to(roomCode).emit('settings_update', game.gameState.settings);
  }));

  socket.on('change_settings', safeHandler((newSettings, game) => {
    game.gameState.settings = { ...game.gameState.settings, ...newSettings };
    io.to(game.roomCode).emit('settings_update', game.gameState.settings);
  }));

  // استقبال أمر الطرد من القائد
  socket.on('kick_player', safeHandler((targetPlayerId, game) => {
    // تحقق من الصلاحيات: هل المرسل هو القائد؟
    const requester = game.getPlayer(socket.id);
    if (!requester || !requester.isHost) {
      socket.emit('error_msg', 'أعط قائد يمكنه طرد اللاعبين');
      return;
    }

    // تنفيذ الطرد
    const success = game.kickPlayer(targetPlayerId);

    if (success) {
      // إبلاغ اللاعب المطلوب (عشان يطلع بره المسحنة)
      io.to(targetPlayerId).emit('kicked_out');

      // قطع اتصاله بالغرفة
      const targetSocket = io.sockets.sockets.get(targetPlayerId);
      if (targetSocket) {
        targetSocket.leave(game.roomCode);
      }

      // تحديث الكائنات للباقين
      io.to(game.roomCode).emit('update_players', game.getAllPlayers());
    }
  }));

  // حدث إعادة اللعبة للوبي
  socket.on('reset_to_lobby', safeHandler((game) => {
    // 1. تأكد إنه القائد
    const requester = game.getPlayer(socket.id);
    if (!requester || !requester.isHost) return;

    // 2. تنظيف بيانات اللعبة
    game.resetGame(); // من نتصف النقاط والجولات
    game.gameState.roundIndex = 0;
    game.gameState.settings.selectedCategories = []; // تمسح الفئات المختارة
    game.gameState.usedQuestionIds = []; // تمسح الأسئلة المستخدمة
    game.gameState.clientSeenIds = []; // تمسح الأسئلة التي رآها اللاعبون
    game.clearRoundTimer(); // توقف التايمر إذا كان شغال

    // 3. إبلاغ الجميع بالرجوع
    io.to(game.roomCode).emit('game_reset');
    io.to(game.roomCode).emit('update_players', game.getAllPlayers());
    io.to(game.roomCode).emit('settings_update', game.gameState.settings);
  }));

  socket.on('start_game', safeHandler((data, game) => {
    const clientSeenIds = data && data.seenIds ? data.seenIds : [];
    
    game.resetGame();
    game.gameState.totalRounds = 10;
    game.gameState.clientSeenIds = clientSeenIds;
    
    io.to(game.roomCode).emit('update_players', game.getAllPlayers());
    io.to(game.roomCode).emit('game_started');
    startCategorySelectionPhase(game);
  }));

 const startCategorySelectionPhase = (game) => {
    game.clearRoundTimer();

    // 👇👇👇 بداية التعديل: التحقق من التعادل (Sudden Death) 👇👇👇
    if (game.gameState.roundIndex >= game.gameState.totalRounds) {
      
      // 1. نجيب اللاعبين ونرتبهم حسب السكور
      const sortedPlayers = game.getAllPlayers().sort((a, b) => b.score - a.score);

      // 2. هل يوجد لاعبين وهل الأول والثاني متعادلين؟
      if (sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score) {
        
        // ✅ فيه تعادل! نزود جولة واحدة كمان
        game.gameState.totalRounds += 1;

        // نبعت رسالة لكل الناس نعرفهم إن فيه جولة حاسمة
        io.to(game.roomCode).emit('error_msg', 'تعادل!  جولة حاسمة لكسر التعادل ');
        
        // الكود هيكمل تنفيذ الدالة عادي عشان يبدأ الجولة الجديدة...
      } else {
        // ❌ مفيش تعادل، ننهي اللعبة
        io.to(game.roomCode).emit('game_over');
        return;
      }
    }
    // 👆👆👆 نهاية التعديل 👆👆👆

    const playersArr = game.getAllPlayers();
    if(playersArr.length === 0) return;

    const turnPlayerIndex = game.gameState.roundIndex % playersArr.length;
    const turnPlayer = playersArr[turnPlayerIndex];
    game.gameState.turnPlayerId = turnPlayer.id;

    // التأكد من وجود فئات
    const allKeys = Object.keys(allQuestionsWithIds);
    const availableCategories = game.gameState.settings.selectedCategories.length > 0 
      ? game.gameState.settings.selectedCategories 
      : (allKeys.length > 0 ? allKeys : ['general']); // fallback

    const randomCategories = availableCategories.sort(() => 0.5 - Math.random()).slice(0, 5);

    io.to(game.roomCode).emit('phase_category_select', {
      turnPlayerId: turnPlayer.id,
      turnPlayerName: turnPlayer.username,
      turnPlayerAvatarId: turnPlayer.avatarId,
      categories: randomCategories,
      roundNumber: game.gameState.roundIndex + 1,
      totalRounds: game.gameState.totalRounds,
      time: game.gameState.settings.timePerRound
    });
  };

  socket.on('category_selected', safeHandler((data, game) => {
    if (socket.id !== game.gameState.turnPlayerId) return;
    
    const { categoryKey, seenIds } = data;
    const clientSeenIds = seenIds || game.gameState.clientSeenIds || [];
    
    const questionObj = getUniqueQuestion(
      categoryKey, 
      clientSeenIds, 
      game.gameState.usedQuestionIds || []
    );

    if (!questionObj) {
      // لو مفيش سؤال رجع، نختار عشوائي من أي حاجة عشان اللعبة متقفش
      console.log("No unique question found, picking random fallback.");
      const categoryQuestions = allQuestionsWithIds[categoryKey] || allQuestionsWithIds['general'] || [];
      if (categoryQuestions.length > 0) {
          const selectedQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
          startWritingPhase(selectedQuestion, game, categoryKey);
      } else {
          socket.emit('error_msg', 'عفواً، لا توجد أسئلة في هذه الفئة!');
      }
    } else {
      startWritingPhase(questionObj, game, categoryKey);
    }
  }));

  // 👇 التعديل المطلوب: دالة startWritingPhase المعدلة لحفظ البيانات
  const startWritingPhase = (q, game, categoryKey) => {
    if (!q) return;
    game.gameState.currentQuestion = q;
    game.gameState.currentCategoryKey = categoryKey;
    game.gameState.fakeAnswers.clear();
    game.gameState.answersType.clear();
    game.gameState.votes.clear();
    game.gameState.whoFoundRealAnswer.clear();
    
    if (!game.gameState.usedQuestionIds) {
      game.gameState.usedQuestionIds = [];
    }
    if (q.id && !game.gameState.usedQuestionIds.includes(q.id)) {
      game.gameState.usedQuestionIds.push(q.id);
    }

    // نحفظ البيانات في متغير عشان نقدر نبحثها كأن لماذا حد يجاب 
    const payload = {
      question: q.text,
      categoryKey: categoryKey,
      roundNumber: game.gameState.roundIndex + 1,
      totalRounds: game.gameState.totalRounds,
      time: game.gameState.settings.timePerRound,
      questionId: q.id,
      img: q.img
    };

    // حفظ البيانات في الحجم
    game.gameState.roundData = payload;

    io.to(game.roomCode).emit('phase_writing', payload);

    const roundTime = game.gameState.settings.timePerRound;
    game.clearRoundTimer();
    game.roundTimer = setTimeout(() => { finalizeWritingPhase(game); }, roundTime * 1000 + 1500);
  };

  const finalizeWritingPhase = (game) => {
    game.clearRoundTimer();
    const categoryKey = game.gameState.currentCategoryKey;
    const categoryQuestions = allQuestionsWithIds[categoryKey] || [];
    
    game.players.forEach(player => {
        if (!game.gameState.fakeAnswers.has(player.id)) {
            let randomBotAnswer = "لا يوجد إجابة";
            if (categoryQuestions.length > 0) {
                const otherQuestions = categoryQuestions.filter(q => q.id !== game.gameState.currentQuestion.id);
                if (otherQuestions.length > 0) {
                    randomBotAnswer = otherQuestions[Math.floor(Math.random() * otherQuestions.length)].a || "إجابة عشوائية";
                }
            }
            game.gameState.fakeAnswers.set(player.id, randomBotAnswer);
            game.gameState.answersType.set(player.id, 'BOT');
            io.to(player.id).emit('submit_success');
        }
    });
    startGuessingPhase(game);
  };

  // 👇 التعديل المطلوب: submit_fake_answer المعدل
  socket.on('submit_fake_answer', safeHandler((fakeText, game) => {
    const cleanFake = fakeText.trim().toLowerCase();
    const cleanReal = (game.gameState.currentQuestion.a || "").trim().toLowerCase();

    if (cleanFake === cleanReal) {
      socket.emit('error_msg', 'مبرووك دي الاجابه الصح, غيرها بسرعه');
      return;
    }

    // 1. حفظ الإجابة
    game.gameState.fakeAnswers.set(socket.id, fakeText);
    game.gameState.answersType.set(socket.id, 'HUMAN');

    // 2. تحديث الكل بقائمة اللي خلصوا (عشان الصور تكون)
    const submittedIds = Array.from(game.gameState.fakeAnswers.keys());
    io.to(game.roomCode).emit('phase_writing', {
      ...game.gameState.roundData, // البيانات القديمة (سؤال وصورة)
      submittedIds: submittedIds // القائمة الجديدة
    });

    socket.emit('submit_success');

    if (game.gameState.fakeAnswers.size >= game.players.size) {
      finalizeWritingPhase(game);
    }
  }));

 const startGuessingPhase = (game) => {
    let options = [{ text: game.gameState.currentQuestion.a, type: 'REAL', owner: 'server' }]; // استخدام .a
    
    // تجميع إجابات اللاعبين
    game.players.forEach(p => {
      const fakeAns = game.gameState.fakeAnswers.get(p.id);
      if (fakeAns) options.push({ text: fakeAns, type: 'FAKE', owner: p.id });
    });
    
    // خلط الإجابات
    options.sort(() => Math.random() - 0.5);
    
    // تجهيز البيانات
    const payload = { 
      question: game.gameState.currentQuestion.text, 
      options,
      time: game.gameState.settings.timePerRound 
    };

    // حفظ البيانات عشان لو حد عمل ريفريش
    game.gameState.roundData = payload;

    // إرسال البيانات للجميع لبدء التصويت
    io.to(game.roomCode).emit('phase_guessing', payload);

    // 👇👇👇 التعديل المهم: ضبط التايمر في السيرفر 👇👇👇
    game.clearRoundTimer(); // مسح أي تايمر قديم
    game.roundTimer = setTimeout(() => {
        // لما الوقت يخلص، انهي الجولة فوراً
        sendRoundResults(game);
    }, game.gameState.settings.timePerRound * 1000 + 1500); // ضفنا ثانية ونص احتياطي عشان الأنيميشن يلحق يخلص
  };

  // 👇 التعديل المطلوب: submit_vote المعدل
  socket.on('submit_vote', safeHandler((selectedOption, game) => {
    // 1. تسجيل التصويت وحساب النقاط (زي ما هي)
    const voter = game.getPlayer(socket.id);
    if (selectedOption.owner === socket.id) voter.score -= 1;
    else if (selectedOption.type === 'REAL') voter.score += 2;
    else {
      const trickster = game.getPlayer(selectedOption.owner);
      const isHumanAnswer = game.gameState.answersType.get(selectedOption.owner) === 'HUMAN';
      if (trickster && isHumanAnswer) trickster.score += 1;
    }

    // 2. التحديث المهم: استخدام الدالة الجديدة وتحديث الكل
    game.gameState.votes.set(socket.id, selectedOption);
    const votedIds = Array.from(game.gameState.votes.keys());

    io.to(game.roomCode).emit('phase_guessing', {
      ...game.gameState.roundData,
      votedIds: votedIds // دلي اللي حتتفل الصور في الفروتة
    });

    // 3. إنهاء الجولة (المنطق الأمن عشان مبطقت)
    // ينجد كل الناس اللي صوتك ونفارته بعدد اللاعبين
    if (game.gameState.votes.size >= game.players.size) {
      sendRoundResults(game);
    }
  }));

  const sendRoundResults = (game) => {
    io.to(game.roomCode).emit('update_players', game.getAllPlayers());
    let optionsMap = new Map();
    const realAns = game.gameState.currentQuestion.a;
    
    optionsMap.set(realAns, { text: realAns, type: 'REAL', owner: 'server', ownerName: 'اللعبه', voters: [] });

    game.gameState.fakeAnswers.forEach((fakeText, ownerId) => {
       const player = game.getPlayer(ownerId);
       let nameToShow = 'لاعب';
       if (game.gameState.answersType.get(ownerId) === 'BOT') {
           nameToShow = 'اللعبه';
       } else if (player) {
           nameToShow = player.username;
       }

       optionsMap.set(fakeText, { text: fakeText, type: 'FAKE', owner: ownerId, ownerName: nameToShow, voters: [] });
    });

    game.gameState.votes.forEach((selectedOpt, voterId) => {
       const voter = game.getPlayer(voterId);
       const target = optionsMap.get(selectedOpt.text);
       if (target && voter) {
         target.voters.push({ id: voter.id, avatarId: voter.avatarId, username: voter.username });
       }
    });
    
    const resultsOptions = Array.from(optionsMap.values());
    io.to(game.roomCode).emit('phase_round_results', {
       question: game.gameState.currentQuestion.text,
       resultsOptions: resultsOptions,
       realAnswer: realAns,
       roundNumber: game.gameState.roundIndex + 1,
       totalRounds: game.gameState.totalRounds
    });
  };

  socket.on('trigger_scoreboard', safeHandler((game) => {
    const player = game.getPlayer(socket.id);
    if (!player || !player.isHost) return;

    const sortedPlayers = game.getAllPlayers().sort((a, b) => b.score - a.score);

    io.to(game.roomCode).emit('phase_scoreboard', {
      players: sortedPlayers,
      roundNumber: game.gameState.roundIndex + 1,
      totalRounds: game.gameState.totalRounds
    });
  }));

  socket.on('trigger_next_round', safeHandler((data, game) => {
     const player = game.getPlayer(socket.id);
     if (!player || !player.isHost) return;
     
     if (data && data.seenIds) {
       game.gameState.clientSeenIds = data.seenIds;
     }
     
     game.gameState.roundIndex++;
     startCategorySelectionPhase(game);
  }));

  socket.on('disconnect', () => {
    const game = getGame(socket.id);
    if (game) {
      game.removePlayer(socket.id);
      io.to(game.roomCode).emit('update_players', game.getAllPlayers());
      if (game.players.size === 0) {
          game.clearRoundTimer();
          games.delete(game.roomCode);
      }
    }
    socketToRoom.delete(socket.id);
  });
});

app.use((err, req, res, next) => res.status(500).send('Something broke!'));
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));