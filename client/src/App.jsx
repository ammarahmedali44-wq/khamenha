import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import WelcomeScreen from './screens/WelcomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import './App.css';

// استبدل السطر اللي فيه io.connect بالسطر ده:
const socket = io.connect("https://dabbes-hom.com");

// 1. مكون القائمة الجانبية (تم إصلاح الخلفية الصفراء والترتيب Z-Index)
const HostMenu = ({ players, onClose, onKick, onResetLobby }) => {
  const [view, setView] = useState('MAIN'); // 'MAIN' or 'KICK_LIST'

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
          {view === 'MAIN' ? 'القائمة' : 'طرد لاعب'}
        </h2>

        <div style={bodyStyle}>
          
          {view === 'MAIN' && (
            <>
              <button style={bigBtnStyle} onClick={() => setView('KICK_LIST')}>
                طرد لاعب 
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
  const [roomCode, setRoomCode] = useState("");
  const [isMyHost, setIsMyHost] = useState(false);

  const [gamePhase, setGamePhase] = useState('CATEGORY_SELECT'); 
  const [roundData, setRoundData] = useState(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  
  const [showHostMenu, setShowHostMenu] = useState(false);

  // حالة لتخزين الفائز النهائي (لحل مشكلة تغير الفائز عند الخروج)
  const [finalWinner, setFinalWinner] = useState(null);

  const [settings, setSettings] = useState({
    timePerRound: 45,
    selectedCategories: []
  });

  const handleEditProfile = () => {
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

    socket.on('connect', () => { setIsConnected(true); setMyId(socket.id); });
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('room_created', (data) => setRoomCode(data.code));
    socket.on('room_info', (data) => setRoomCode(data.code));
    socket.on('error_msg', (msg) => alert(msg));

    socket.on('join_success', (data) => {
      if (data && data.isHost !== undefined) setIsMyHost(data.isHost);
      if (data && data.players) setPlayers(data.players);
      setGameState('LOBBY');
    });

    socket.on('update_players', (currentPlayers) => {
      setPlayers(currentPlayers);
      const me = currentPlayers.find(p => p.id === socket.id);
      if (me) setIsMyHost(me.isHost);
    });

    socket.on('settings_update', (newSettings) => setSettings(newSettings));

    socket.on('kicked_out', () => {
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
    socket.on('game_over', () => {
      setGameState('FINISHED');
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
      socket.off('error_msg'); socket.off('join_success');
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
  const handleUpdateSettings = (newSettingsPart) => socket.emit('change_settings', newSettingsPart);

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
        />
      )}

      {gameState === 'FINISHED' && finalWinner && (
        <div className="game-over-screen-final">
          <h1 className="winner-title-text">الفائز هو</h1>
          <img 
            src={`/avatars/${finalWinner.avatarId}.png`} 
            alt={finalWinner.username} 
            className="winner-avatar-clean" 
          />
          <h2 className="winner-name-text">{finalWinner.username}</h2>
          
          <button className="btn-restart-simple" onClick={() => window.location.reload()}>
             لعب مرة أخرى ↻
          </button>
        </div>
      )}

    </div>
  );
}

export default App;