import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import WelcomeScreen from './screens/WelcomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import './App.css';

// الاتصال بالسيرفر تلقائياً (نفس الدومين)
const socket = io.connect(window.location.origin);

// 1. مكون القائمة الجانبية (تم إصلاح الخلفية الصفراء والترتيب Z-Index)
const HostMenu = ({ players, onClose, onKick, onResetLobby }) => {
  const [view, setView] = useState('MAIN'); // 'MAIN', 'KICK_LIST', or 'HOW_TO_PLAY'

  const overlayStyle = { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    background: 'rgba(0,0,0,0.7)', // خلفية سوداء شفافة
    zIndex: 99999, // طبقة عالية جداً لتظهر فوق اللعبة
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    backdropFilter: 'blur(5px)'
  };
  
  const contentStyle = { 
    background: '#FFF9C4', 
    width: '90%', 
    maxWidth: '350px', 
    borderRadius: '15px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
    overflow: 'hidden', 
    border: '4px solid #FF5722',
    animation: 'popIn 0.3s ease-out'
  };

  const headerStyle = { 
    backgroundColor: '#FF5722', 
    color: 'white', 
    textAlign: 'center', 
    padding: '15px', 
    fontSize: '1.5rem', 
    fontWeight: 'bold', 
    margin: 0,
    fontFamily: 'Lalezar, system-ui'
  };

  const bodyStyle = { 
    padding: '30px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px'
  };

  const bigBtnStyle = { 
    backgroundColor: '#FFC107', 
    color: '#3E2723', 
    border: 'none', 
    padding: '15px', 
    fontSize: '1.2rem', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    borderRadius: '10px', 
    width: '100%', 
    boxShadow: '0 4px 0 #FFA000',
    fontFamily: 'Lalezar, system-ui'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        
        <h2 style={headerStyle}>
          {view === 'MAIN' ? 'القائمة' : view === 'KICK_LIST' ? 'طرد لاعب' : 'طريقة اللعب'}
        </h2>

        <div style={bodyStyle}>
          
          {view === 'MAIN' && (
            <>
              <button style={bigBtnStyle} onClick={() => setView('KICK_LIST')}>
                طرد لاعب 
              </button>
              
              <button style={bigBtnStyle} onClick={() => setView('HOW_TO_PLAY')}>
                طريقة اللعب
              </button>

              <button
                style={{...bigBtnStyle, backgroundColor: '#f44336', color: 'white', boxShadow: '0 4px 0 #d32f2f'}}
                onClick={() => {
                    if(window.confirm("هل أنت متأكد؟ سيعود الجميع لغرفة الانتظار.")) {
                      onResetLobby(); onClose();
                    }
                }}
              >
                إنهاء اللعبة
              </button>
            </>
          )}

          {view === 'HOW_TO_PLAY' && (
            <>
              <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '5px', direction: 'rtl', textAlign: 'right', lineHeight: '1.8', color: '#3E2723', fontSize: '0.95rem' }}>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginTop: 0 }}>:طريقة اللعب</p>
                <ol style={{ paddingRight: '20px', margin: '0 0 15px 0' }}>
                  <li>ادخل أنت وأصدقاؤك إلى اللعبة واختاروا الفئات التي تريدونها.</li>
                  <li>سيظهر سؤال من إحدى الفئات المختارة.</li>
                  <li>كل لاعب يجب أن يكتب إجابة خاطئة تبدو مقنعة، ولا يكتب الإجابة الصحيحة.</li>
                  <li>ستعرض اللعبة الإجابة الصحيحة مع جميع إجابات اللاعبين.</li>
                  <li>يختار كل لاعب إجابة واحدة يعتقد أنها الصحيحة.</li>
                </ol>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: '10px 0 5px 0' }}>النقاط:</p>
                <ul style={{ paddingRight: '20px', margin: 0, listStyleType: 'none' }}>
                  <li>✅ اختيار الإجابة الصحيحة: تحصل على نقطتين.</li>
                  <li>🎭 إذا اختار أحد اللاعبين إجابتك التي كتبتها: تحصل على نقطة واحدة.</li>
                  <li>👤 إذا اخترت إجابة لاعب آخر: يحصل هو على نقطة واحدة.</li>
                  <li>❌ إذا اخترت إجابتك أنت: تخسر نقطة (-1)</li>
                </ul>
              </div>

              <div
                style={{ color: '#E65100', textAlign: 'center', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px', fontWeight: 'bold' }}
                onClick={() => setView('MAIN')}
              >
                رجوع للقائمة
              </div>
            </>
          )}

          {view === 'KICK_LIST' && (
            <>
              <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '5px' }}>
                {players.filter(p => !p.isHost).length === 0 ? (
                  <p style={{textAlign:'center', color: '#795548', fontWeight:'bold'}}>لا يوجد لاعبين غيرك!</p>
                ) : (
                  players.map(p => (
                    !p.isHost && (
                      <div key={p.id} style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        background: 'white', padding: '10px', marginBottom: '10px', 
                        borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img 
                            src={`/avatars/${p.avatarId}.png`} 
                            alt="avatar" 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'contain', border: '2px solid #eee'}}
                            onError={(e) => e.target.src = '/avatars/1.png'}
                          />
                          <span style={{fontWeight:'bold', color:'#333', fontSize:'0.9rem'}}>{p.username}</span>
                        </div>
                        <button 
                          style={{ 
                            backgroundColor: '#FF5252', color: 'white', border: 'none', 
                            padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'Lalezar' 
                          }}
                          onClick={() => { if(window.confirm(`طرد ${p.username}؟`)) onKick(p.id); }}
                        >
                          طرد
                        </button>
                      </div>
                    )
                  ))
                )}
              </div>
              
              <div 
                style={{ color: '#E65100', textAlign: 'center', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px', fontWeight: 'bold' }} 
                onClick={() => setView('MAIN')}
              >
                رجوع للقائمة
              </div>
            </>
          )}

           <button 
             style={{ 
               backgroundColor: '#009688', color: 'white', border: 'none', padding: '12px', 
               width: '100%', borderRadius: '10px', fontWeight: 'bold', 
               cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 0 #00796B', fontFamily: 'Lalezar' 
             }}
             onClick={onClose}
           >
             إغلاق
           </button>

        </div>
      </div>
    </div>
  );
};

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState('WELCOME'); 
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState("");
  const [roomCode, setRoomCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || "";
  });
  const [isMyHost, setIsMyHost] = useState(false);

  const [gamePhase, setGamePhase] = useState('CATEGORY_SELECT'); 
  const [roundData, setRoundData] = useState(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  
  const [showHostMenu, setShowHostMenu] = useState(false);

  // حالة لتخزين الفائز النهائي (لحل مشكلة تغير الفائز عند الخروج)
  const [finalWinner, setFinalWinner] = useState(null);
  const [gameStats, setGameStats] = useState({});

  const [settings, setSettings] = useState({
    timePerRound: 45,
    totalRounds: 10,
    selectedCategories: []
  });

  const handleEditProfile = () => {
    localStorage.removeItem('gameSession');
    if (socket) {
      socket.disconnect();
    }
    setGameState('WELCOME');
  };

  const saveSeenQuestion = (qId) => {
    if (!qId) return;
    const saved = localStorage.getItem('seenQuestions');
    let seen = saved ? JSON.parse(saved) : [];
    if (!seen.includes(qId)) {
      seen.push(qId);
      localStorage.setItem('seenQuestions', JSON.stringify(seen));
    }
  };

  const getSeenQuestions = () => {
    const saved = localStorage.getItem('seenQuestions');
    return saved ? JSON.parse(saved) : [];
  };

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    socket.on('connect', () => {
      setIsConnected(true);
      setMyId(socket.id);
      // Auto-rejoin if session exists within 5 minutes
      try {
        const session = JSON.parse(localStorage.getItem('gameSession') || '{}');
        if (session.username && session.roomCode && session.joined) {
          const elapsed = Date.now() - (session.timestamp || 0);
          if (elapsed < 5 * 60 * 1000) {
            socket.emit('join_game', {
              username: session.username,
              avatarId: session.avatarId,
              codeInput: session.roomCode,
              isJoinMode: true
            });
          } else {
            localStorage.removeItem('gameSession');
          }
        }
      } catch(e) {}
    });
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('room_created', (data) => {
      setRoomCode(data.code);
      try {
        const session = JSON.parse(localStorage.getItem('gameSession') || '{}');
        session.roomCode = data.code;
        localStorage.setItem('gameSession', JSON.stringify(session));
      } catch(e) {}
    });
    socket.on('room_info', (data) => {
      setRoomCode(data.code);
      try {
        const session = JSON.parse(localStorage.getItem('gameSession') || '{}');
        session.roomCode = data.code;
        localStorage.setItem('gameSession', JSON.stringify(session));
      } catch(e) {}
    });
    socket.on('error_msg', (msg) => alert(msg));

    socket.on('join_failed', () => {
      localStorage.removeItem('gameSession');
      setGameState('WELCOME');
    });

    socket.on('join_success', (data) => {
      if (data && data.isHost !== undefined) setIsMyHost(data.isHost);
      if (data && data.players) setPlayers(data.players);
      setGameState('LOBBY');
      // Save session for auto-rejoin on disconnect
      try {
        const session = JSON.parse(localStorage.getItem('gameSession') || '{}');
        if (session.username) {
          localStorage.setItem('gameSession', JSON.stringify({ ...session, joined: true }));
        }
      } catch(e) {}
    });

    socket.on('update_players', (currentPlayers) => {
      setPlayers(currentPlayers);
      const me = currentPlayers.find(p => p.id === socket.id);
      if (me) setIsMyHost(me.isHost);
    });

    socket.on('settings_update', (newSettings) => setSettings(newSettings));

    socket.on('kicked_out', () => {
      localStorage.removeItem('gameSession');
      alert("تم طردك من الغرفة بواسطة القائد");
      setGameState('WELCOME');
      setPlayers([]);
      setRoomCode("");
      setRoundData(null);
      setIsMyHost(false);
      setShowHostMenu(false);
    });

    socket.on('game_reset', () => {
      setGameState('LOBBY');
      setGamePhase('CATEGORY_SELECT');
      setRoundData(null);
      setHasSubmittedAnswer(false);
    });

    socket.on('game_started', () => {
      // الانتظار لحدث اختيار الفئة
    });

    socket.on('phase_category_select', (data) => {
      setGameState('GAME'); 
      setGamePhase('CATEGORY_SELECT');
      setRoundData(data);
      setHasSubmittedAnswer(false); 
    });

    socket.on('phase_writing', (data) => {
      setGameState('GAME');
      setGamePhase('WRITING');
      setRoundData(data);

      // Preload question image for fast display
      if (data.img) {
        const preloadImg = new Image();
        preloadImg.src = data.img;
      }

      // حل مشكلة تكرار الكتابة: التأكد من قائمة المسلمين
      if (data.submittedIds && data.submittedIds.includes(socket.id)) {
         setHasSubmittedAnswer(true);
      } else {
         setHasSubmittedAnswer(false);
      }

      if (data.questionId) {
        saveSeenQuestion(data.questionId);
      }
    });
    
    socket.on('submit_success', () => setHasSubmittedAnswer(true));

    socket.on('phase_guessing', (data) => {
      setGamePhase('GUESSING');
      setRoundData(prev => ({ ...prev, ...data }));
    });

    socket.on('phase_round_results', (data) => {
      setGameState('GAME');
      setGamePhase('ROUND_RESULTS');
      setRoundData(data);
    });

    socket.on('phase_scoreboard', (data) => {
      setGameState('GAME');
      setGamePhase('SCOREBOARD');
      setRoundData(data); 
    });

    // حل مشكلة تغير الفائز: تثبيت الفائز عند انتهاء اللعبة
    socket.on('game_over', (data) => {
      setGameState('FINISHED');
      setGameStats(data?.playerStats || {});
      setPlayers(currentPlayers => {
        const sorted = [...currentPlayers].sort((a, b) => b.score - a.score);
        setFinalWinner(sorted[0]);
        return currentPlayers;
      });
    });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      
      socket.off('connect'); socket.off('disconnect');
      socket.off('room_created'); socket.off('room_info');
      socket.off('error_msg'); socket.off('join_failed'); socket.off('join_success');
      socket.off('update_players'); socket.off('settings_update');
      socket.off('kicked_out'); 
      socket.off('game_reset'); 
      socket.off('game_started'); 
      socket.off('phase_category_select'); socket.off('phase_writing');
      socket.off('phase_guessing'); socket.off('game_over');
      socket.off('submit_success');
      socket.off('phase_round_results'); 
      socket.off('phase_scoreboard');
    };
  }, []);

  const handleJoinGame = (userData) => {
    // Save session for auto-rejoin
    localStorage.setItem('gameSession', JSON.stringify({
      username: userData.username,
      avatarId: userData.avatarId,
      roomCode: userData.codeInput || '',
      isJoinMode: userData.isJoinMode,
      timestamp: Date.now()
    }));
    if (userData.isJoinMode) {
        socket.emit('join_game', userData);
    } else {
        socket.emit('create_game', userData);
    }
  };

  const handleStartGame = () => {
    setFinalWinner(null); // تصفير الفائز عند بدء لعبة جديدة
    const seenIds = getSeenQuestions();
    socket.emit('start_game', { seenIds });
  };

  const handleSelectCategory = (catKey) => {
    const seenIds = getSeenQuestions();
    socket.emit('category_selected', { categoryKey: catKey, seenIds });
  };

  const handleSubmitFake = (fakeText) => socket.emit('submit_fake_answer', fakeText);
  const handleVote = (option) => socket.emit('submit_vote', option);
  const handleUpdateSettings = (newSettingsPart) => {
    setSettings(prev => ({ ...prev, ...newSettingsPart }));
    socket.emit('change_settings', newSettingsPart);
  };

  const handleNextRound = () => {
    const seenIds = getSeenQuestions();
    socket.emit('trigger_next_round', { seenIds });
  };

  const handleShowScoreboard = () => {
    socket.emit('trigger_scoreboard');
  };

  const myScore = players.find(p => p.id === myId)?.score || 0;

  return (
    <div className="app-container">
      {!isConnected && <div style={{position:'absolute',top:10,left:10,background:'red',color:'white',padding:5}}>جاري الاتصال...</div>}

      {isMyHost && gameState !== 'WELCOME' && gameState !== 'FINISHED' && (
        <button
          className="hamburger-btn"
          onClick={() => setShowHostMenu(true)}
          title="القائمة"
        >
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </button>
      )}

      {showHostMenu && (
        <HostMenu
          players={players}
          onClose={() => setShowHostMenu(false)}
          onKick={(id) => socket.emit('kick_player', id)}
          onResetLobby={() => socket.emit('reset_to_lobby')}
        />
      )}

      {gameState === 'WELCOME' && <WelcomeScreen onJoinGame={handleJoinGame} initialCode={roomCode} />}
      
      {gameState === 'LOBBY' && (
        <LobbyScreen 
          players={players} 
          onStartGame={handleStartGame} 
          roomCode={roomCode} 
          isHostOverride={isMyHost}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          myId={myId}
          onEditProfile={handleEditProfile}
        />
      )}
      
      {gameState === 'GAME' && roundData && (
        <GameScreen
          phase={gamePhase}
          roundData={roundData}
          players={players}
          settings={settings}
          onSubmitFake={handleSubmitFake}
          onVote={handleVote}
          onSelectCategory={handleSelectCategory}
          myId={myId}
          hasSubmitted={hasSubmittedAnswer}
          isHost={isMyHost}
          onNextRound={handleNextRound}
          onShowScoreboard={handleShowScoreboard}
          tvMode={settings?.tvMode || false}
        />
      )}

      {gameState === 'FINISHED' && finalWinner && (
        <div className="game-over-screen-final">
          {/* Confetti */}
          <div className="confetti-container">
            {Array.from({length: 50}).map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][i % 8],
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
              }} />
            ))}
          </div>

          <h1 className="winner-title-text" style={{animation: 'bounceIn 0.8s ease-out'}}>الفائز</h1>

          {/* Top 3 Podium */}
          <div className="podium-container">
            {(() => {
              const activePlayers = settings?.tvMode ? players.filter(p => !p.isHost) : players;
              const sorted = [...activePlayers].sort((a, b) => b.score - a.score);
              const top3 = sorted.slice(0, 3);
              const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length >= 2 ? [top3[1], top3[0]] : [top3[0]];
              const podiumHeights = top3.length >= 3 ? [140, 190, 100] : top3.length >= 2 ? [140, 190] : [190];
              const podiumRanks = top3.length >= 3 ? [1, 0, 2] : top3.length >= 2 ? [1, 0] : [0];
              // Animation: 1st appears first (0.3s), then 2nd (0.6s), then 3rd (0.9s)
              const animDelays = top3.length >= 3 ? [0.6, 0.3, 0.9] : top3.length >= 2 ? [0.6, 0.3] : [0.3];

              return podiumOrder.map((p, idx) => (
                <div key={p.id} className="podium-player" style={{animationDelay: `${animDelays[idx]}s`}}>
                  <img src={`/avatars/${p.avatarId}.png`} alt={p.username} className="podium-avatar"
                    onError={(e) => e.target.src = '/avatars/1.png'} />
                  <span className="podium-name">{p.username}</span>
                  <div className="podium-bar" style={{height: `${podiumHeights[idx]}px`}}>
                    <span className="podium-score">{p.score}</span>
                  </div>
                </div>
              ));
            })()}
          </div>

          <button className="btn-restart-simple" onClick={() => {
            socket.emit('reset_to_lobby');
            setFinalWinner(null);
            setGameStats({});
          }}>
             لعب مرة أخرى ↻
          </button>
        </div>
      )}

    </div>
  );
}

export default App;