  const express = require('express');
  const http = require('http');
  const { Server } = require('socket.io');
  const cors = require('cors');
  const GameManager = require('./GameManager');
  const { log } = require('./logger');
  const path = require('path');
  const questionsDB = require('./questions.json');

  const app = express();

  // 👇 التعديل: السماح بالحروف الإنجليزية والأرقام وعدم حذفها
  const normalizeArabic = (text) => {
    if (!text) return "";
    return text.toString()
      .trim()
      .toLowerCase()
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED]/g, '') // تشكيل
      // 👇 السطر ده كان المشكلة: شلنا منه حذف الإنجليزي
      .replace(/[^\u0621-\u064A\s0-9a-zA-Z]/g, '') 
      .replace(/\s+/g, ' ')
      .trim();
  };

  app.use(cors());
  app.use(express.static(path.join(__dirname, '../client/dist')));

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });

  const games = new Map();
  const socketToRoom = new Map();

  let allQuestionsWithIds = {};
  let globalIdCounter = 1;

  for (const [category, questions] of Object.entries(questionsDB)) {
    allQuestionsWithIds[category] = questions.map(q => ({
      ...q, text: q.text || q.q || "سؤال فارغ", id: q.id || `gen_${globalIdCounter++}`
    }));
  }

  const getUniqueQuestion = (categoryKey, excludeIds, roomUsedIds) => {
    let categoryQuestions = allQuestionsWithIds[categoryKey];

    if (!categoryQuestions) {
      categoryQuestions = allQuestionsWithIds['general'];
    }

    if (!categoryQuestions) {
      return null;
    }

    const available = categoryQuestions.filter(q =>
      !excludeIds.includes(q.id) && !roomUsedIds.includes(q.id)
    );

    if (available.length === 0) {
      const resetAvailable = categoryQuestions.filter(q => !roomUsedIds.includes(q.id));
      if (resetAvailable.length === 0) return null;
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
        }
      };
    };

    // Helper: get players who actively participate (exclude host in TV mode)
    const getActivePlayers = (game) => {
      const tvMode = game.gameState.settings.tvMode;
      return game.getAllPlayers().filter(p => {
        if (p.disconnected) return false;
        if (tvMode && p.isHost) return false;
        return true;
      });
    };

    const sendRoundResults = (game) => {
      const optionsMap = new Map();
      const realAns = game.gameState.currentQuestion.a;
      const realAnsNorm = normalizeArabic(realAns);

      optionsMap.set(realAnsNorm, {
        text: realAns,
        type: 'REAL',
        owners: ['server'],
        ownerName: 'اللعبه',
        voters: []
      });

      game.gameState.fakeAnswers.forEach((fakeText, ownerId) => {
        const normKey = normalizeArabic(fakeText);
        if (optionsMap.has(normKey)) {
          const existing = optionsMap.get(normKey);
          if (!existing.owners.includes(ownerId)) {
            existing.owners.push(ownerId);
          }
        } else {
          optionsMap.set(normKey, {
            text: fakeText,
            type: 'FAKE',
            owners: [ownerId],
            ownerName: '',
            voters: []
          });
        }
      });

      optionsMap.forEach((opt, key) => {
        if (opt.type === 'FAKE') {
          const names = opt.owners.map(id => {
            if (id === 'server') return 'اللعبه';
            const player = game.getPlayer(id);
            return player ? player.username : '';
          }).filter(Boolean);
          opt.ownerName = names.join(' و ') || 'لاعب';
        }
      });

      game.gameState.votes.forEach((selectedOpt, voterId) => {
        const voter = game.getPlayer(voterId);
        if (!voter) return;

        const selectedNorm = normalizeArabic(selectedOpt.text);
        const targetOption = optionsMap.get(selectedNorm);
        if (!targetOption) return;

        targetOption.voters.push({
          id: voter.id,
          avatarId: voter.avatarId,
          username: voter.username
        });

  // --- حساب النقاط (تعديل الأرقام) ---
            if (targetOption.type === 'REAL') {
                // ✅ لو عرف الإجابة الصح: ياخد نقطتين (عشان ده أصعب)
                voter.score += 2; 
            } 
            else if (targetOption.type === 'FAKE') {
                // ❌ لو اختار كذبة
                
                if (targetOption.owners.includes(voterId)) {
                    // 😡 عقاب: صوت لنفسه
                    voter.score -= 1; 
                } else {
                    // 🤝 لو خدع غيره: ياخد نقطة واحدة
                    targetOption.owners.forEach(ownerId => {
                        if (ownerId === 'server') return;
                        const author = game.getPlayer(ownerId);
                        // طبعاً المصوت نفسه مش هياخد نقط حتى لو كان مشارك
                        if (author && author.id !== voterId) {
                            author.score += 1; // 👈 هنا التعديل (نقطة واحدة للخداع)
                        }
                    });
                }
            }
      });

      io.to(game.roomCode).emit('update_players', game.getAllPlayers());

      const resultsOptions = Array.from(optionsMap.values());
      io.to(game.roomCode).emit('phase_round_results', {
        question: game.gameState.currentQuestion.text,
        resultsOptions: resultsOptions,
        realAnswer: realAns,
        roundNumber: game.gameState.roundIndex + 1,
        totalRounds: game.gameState.totalRounds
      });
    };

    const startGuessingPhase = (game) => {
      const uniqueOptionsMap = new Map();

      const realAnsNorm = normalizeArabic(game.gameState.currentQuestion.a);
      uniqueOptionsMap.set(realAnsNorm, {
        text: game.gameState.currentQuestion.a,
        type: 'REAL',
        owners: ['server']
      });

      game.players.forEach(p => {
        const fakeAns = game.gameState.fakeAnswers.get(p.id);
        if (fakeAns) {
          const normKey = normalizeArabic(fakeAns);
          if (uniqueOptionsMap.has(normKey)) {
            const existing = uniqueOptionsMap.get(normKey);
            if (!existing.owners.includes(p.id)) {
              existing.owners.push(p.id);
            }
          } else {
            uniqueOptionsMap.set(normKey, {
              text: fakeAns,
              type: 'FAKE',
              owners: [p.id]
            });
          }
        }
      });

      let options = Array.from(uniqueOptionsMap.values());
      options.sort(() => Math.random() - 0.5);

      const payload = {
        question: game.gameState.currentQuestion.text,
        options,
        time: game.gameState.settings.timePerRound
      };

      game.gameState.roundData = payload;

      io.to(game.roomCode).emit('phase_guessing', payload);

      game.clearRoundTimer();
      game.roundTimer = setTimeout(() => {
        sendRoundResults(game);
      }, game.gameState.settings.timePerRound * 1000 + 1500);
    };

    const finalizeWritingPhase = (game) => {
      game.clearRoundTimer();
      const categoryKey = game.gameState.currentCategoryKey;
      const categoryQuestions = allQuestionsWithIds[categoryKey] || [];

      const tvMode = game.gameState.settings.tvMode;
      game.players.forEach(player => {
        if (!game.gameState.fakeAnswers.has(player.id) && !player.disconnected && !(tvMode && player.isHost)) {
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

      const payload = {
        question: q.text,
        categoryKey: categoryKey,
        roundNumber: game.gameState.roundIndex + 1,
        totalRounds: game.gameState.totalRounds,
        time: game.gameState.settings.timePerRound,
        questionId: q.id,
        img: q.img
      };

      game.gameState.roundData = payload;

      io.to(game.roomCode).emit('phase_writing', payload);

      const roundTime = game.gameState.settings.timePerRound;
      game.clearRoundTimer();
      game.roundTimer = setTimeout(() => { finalizeWritingPhase(game); }, roundTime * 1000 + 1500);
    };

    const startCategorySelectionPhase = (game) => {
      game.clearRoundTimer();

      if (game.gameState.roundIndex >= game.gameState.totalRounds) {
        const sortedPlayers = game.getAllPlayers().sort((a, b) => b.score - a.score);
        if (sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score) {
          game.gameState.totalRounds += 1;
          io.to(game.roomCode).emit('error_msg', 'تعادل! جولة حاسمة لكسر التعادل');
        } else {
          io.to(game.roomCode).emit('game_over');
          return;
        }
      }

      const playersArr = getActivePlayers(game);
      if (playersArr.length === 0) return;

      const turnPlayerIndex = game.gameState.roundIndex % playersArr.length;
      const turnPlayer = playersArr[turnPlayerIndex];
      game.gameState.turnPlayerId = turnPlayer.id;

      const allKeys = Object.keys(allQuestionsWithIds);
      const availableCategories = game.gameState.settings.selectedCategories.length > 0
        ? game.gameState.settings.selectedCategories
        : (allKeys.length > 0 ? allKeys : ['general']);

      const randomCategories = availableCategories.sort(() => 0.5 - Math.random()).slice(0, 5);

      const payload = {
        turnPlayerId: turnPlayer.id,
        turnPlayerName: turnPlayer.username,
        turnPlayerAvatarId: turnPlayer.avatarId,
        categories: randomCategories,
        roundNumber: game.gameState.roundIndex + 1,
        totalRounds: game.gameState.totalRounds,
        time: game.gameState.settings.timePerRound
      };

      game.gameState.roundData = payload;
      io.to(game.roomCode).emit('phase_category_select', payload);
    };

    socket.on('create_game', safeHandler(function handleCreate(data) {
      const roomCode = generateRoomCode();
      const newGame = new GameManager(roomCode);
      newGame.addPlayer(socket.id, data.username, data.avatarId, true);

      const player = newGame.getPlayer(socket.id);
      if (player) player.disconnected = false;

      newGame.gameState.totalRounds = newGame.gameState.settings.totalRounds;

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

      const existingPlayerEntry = Array.from(game.players.entries()).find(
        ([id, p]) => p.username === data.username && p.disconnected === true
      );

      if (existingPlayerEntry) {
        const [oldId, playerObj] = existingPlayerEntry;

        // Clear the 5-minute disconnect timer
        if (playerObj.disconnectTimer) {
          clearTimeout(playerObj.disconnectTimer);
          playerObj.disconnectTimer = null;
        }

        playerObj.disconnected = false;
        playerObj.id = socket.id;

        game.players.delete(oldId);
        game.players.set(socket.id, playerObj);

        socketToRoom.set(socket.id, roomCode);
        socket.join(roomCode);

        socket.emit('room_info', { code: roomCode });
        socket.emit('join_success', { isHost: playerObj.isHost, players: game.getAllPlayers() });

        if (game.gameState.roundData) {
          const eventName = game.gameState.roundData.options ? 'phase_guessing' : 'phase_writing';
          socket.emit(eventName, game.gameState.roundData);
        }

        io.to(roomCode).emit('update_players', game.getAllPlayers());
        return;
      }

      game.addPlayer(socket.id, data.username, data.avatarId, false);
      const player = game.getPlayer(socket.id);
      if (player) player.disconnected = false;

      socketToRoom.set(socket.id, roomCode);
      socket.join(roomCode);
      socket.emit('room_info', { code: roomCode });
      socket.emit('join_success', { isHost: false, players: game.getAllPlayers() });
      io.to(roomCode).emit('update_players', game.getAllPlayers());
      io.to(roomCode).emit('settings_update', game.gameState.settings);
    }));

    socket.on('change_settings', safeHandler((newSettings, game) => {
      if (newSettings.totalRounds !== undefined) {
        newSettings.totalRounds = Math.max(1, Math.min(35, parseInt(newSettings.totalRounds) || 10));
        game.gameState.totalRounds = newSettings.totalRounds;
      }
      game.gameState.settings = { ...game.gameState.settings, ...newSettings };
      io.to(game.roomCode).emit('settings_update', game.gameState.settings);
    }));

    socket.on('kick_player', safeHandler((targetPlayerId, game) => {
      const requester = game.getPlayer(socket.id);
      if (!requester || !requester.isHost) {
        socket.emit('error_msg', 'أعط قائد يمكنه طرد اللاعبين');
        return;
      }

      const success = game.kickPlayer(targetPlayerId);

      if (success) {
        io.to(targetPlayerId).emit('kicked_out');
        const targetSocket = io.sockets.sockets.get(targetPlayerId);
        if (targetSocket) {
          targetSocket.leave(game.roomCode);
        }
        io.to(game.roomCode).emit('update_players', game.getAllPlayers());
      }
    }));

    socket.on('reset_to_lobby', safeHandler((game) => {
      const savedSettings = { ...game.gameState.settings };

      game.resetGame();
      game.gameState.roundIndex = 0;
      game.gameState.settings = savedSettings;
      game.gameState.usedQuestionIds = [];
      game.gameState.clientSeenIds = [];
      game.clearRoundTimer();

      io.to(game.roomCode).emit('game_reset');
      io.to(game.roomCode).emit('update_players', game.getAllPlayers());
      io.to(game.roomCode).emit('settings_update', game.gameState.settings);
    }));

    socket.on('start_game', safeHandler((data, game) => {
      const clientSeenIds = data && data.seenIds ? data.seenIds : [];

      game.resetGame();
      game.gameState.totalRounds = game.gameState.settings.totalRounds || 10;
      game.gameState.clientSeenIds = clientSeenIds;

      io.to(game.roomCode).emit('update_players', game.getAllPlayers());
      io.to(game.roomCode).emit('game_started');
      startCategorySelectionPhase(game);
    }));

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

    socket.on('submit_fake_answer', safeHandler((fakeText, game) => {
      // Block host from participating in TV mode
      const hostPlayer = game.getPlayer(socket.id);
      if (game.gameState.settings.tvMode && hostPlayer && hostPlayer.isHost) return;

      const cleanFake = normalizeArabic(fakeText);
      const cleanReal = normalizeArabic(game.gameState.currentQuestion.a || "");

      if (cleanFake === cleanReal) {
        socket.emit('error_msg', 'مبرووك دي الاجابه الصح, غيرها بسرعه');
        return;
      }

      game.gameState.fakeAnswers.set(socket.id, fakeText);
      game.gameState.answersType.set(socket.id, 'HUMAN');

      const submittedIds = Array.from(game.gameState.fakeAnswers.keys());
      io.to(game.roomCode).emit('phase_writing', {
        ...game.gameState.roundData,
        submittedIds: submittedIds
      });

      socket.emit('submit_success');

      const activeCount = getActivePlayers(game).length;
      if (game.gameState.fakeAnswers.size >= activeCount) {
        finalizeWritingPhase(game);
      }
    }));

    socket.on('submit_vote', safeHandler((selectedOption, game) => {
      const voter = game.getPlayer(socket.id);
      if (!voter) return;
      // Block host from voting in TV mode
      if (game.gameState.settings.tvMode && voter.isHost) return;

      game.gameState.votes.set(socket.id, selectedOption);
      const votedIds = Array.from(game.gameState.votes.keys());

      io.to(game.roomCode).emit('phase_guessing', {
        ...game.gameState.roundData,
        votedIds: votedIds
      });

      const activeVoterCount = getActivePlayers(game).length;
      if (game.gameState.votes.size >= activeVoterCount) {
        game.clearRoundTimer();
        sendRoundResults(game);
      }
    }));

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
        const player = game.getPlayer(socket.id);
        if (player) {
          player.disconnected = true;

          // 5-minute timeout to permanently remove disconnected player
          player.disconnectTimer = setTimeout(() => {
            if (player.disconnected) {
              game.removePlayer(socket.id);
              if (game.players.size === 0) {
                game.clearRoundTimer();
                games.delete(game.roomCode);
              } else {
                io.to(game.roomCode).emit('update_players', game.getAllPlayers());
              }
            }
          }, 5 * 60 * 1000); // 5 minutes
        }

        if (game.gameState.roundIndex === 0 && !game.gameState.currentQuestion) {
          if (player && player.disconnectTimer) {
            clearTimeout(player.disconnectTimer);
            player.disconnectTimer = null;
          }
          game.removePlayer(socket.id);
          if (game.players.size === 0) {
            game.clearRoundTimer();
            games.delete(game.roomCode);
          }
        }

        io.to(game.roomCode).emit('update_players', game.getAllPlayers());
      }
      socketToRoom.delete(socket.id);
    });
  });

  app.use((err, req, res, next) => res.status(500).send('Something broke!'));

  // رجعه 5000 أو المتغير بدع السيرفر
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`SERVER RUNNING ON PORT ${PORT}`));