import { useState, useEffect } from 'react';
import { getCategoryName } from '../categoriesList';

const GameScreen = ({ phase, roundData, players, settings, onSubmitFake, onVote, onSelectCategory, myId, hasSubmitted, isHost, onNextRound, onShowScoreboard, tvMode }) => {
  const [fakeAnswer, setFakeAnswer] = useState("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [fixedWinner, setFixedWinner] = useState(null);
  const [zoomedImg, setZoomedImg] = useState(null);

  // TV mode: host = TV display, players = phone controls
  const isTvDisplay = tvMode && isHost;
  const isTvPlayer = tvMode && !isHost;
  const tvClass = isTvDisplay ? ' tv-mode' : '';
  // Active players count (exclude host in TV mode)
  const activePlayers = tvMode ? players.filter(p => !p.isHost) : players;
  const activeCount = activePlayers.length;

  useEffect(() => {
    if (phase === 'GAME_OVER' && players.length > 0 && !fixedWinner) {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      setFixedWinner(sorted[0]);
    }
  }, [phase, players, fixedWinner]);

  const renderRoundInfo = () => (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: isTvDisplay ? '10px 25px' : '5px 15px',
      borderRadius: '20px',
      color: '#FFF',
      fontWeight: '900',
      fontSize: isTvDisplay ? '1.8rem' : '1.1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexDirection: 'row-reverse'
    }}>
        <span>الجولة</span>
        <span style={{direction: 'ltr', unicodeBidi: 'embed', color: '#FFD700'}}>
          {roundData?.roundNumber || 1}/{roundData?.totalRounds || 10}
        </span>
    </div>
  );

  // Player status bar (shows who submitted/voted)
  const renderPlayerStatus = (statusIds, checkField) => {
    const displayPlayers = isTvDisplay ? activePlayers : players;
    return (
    <div style={{display: 'flex', gap: isTvDisplay ? '25px' : '15px', justifyContent: 'center', paddingBottom: '20px', width: '100%', flexWrap: 'wrap'}}>
      {displayPlayers.map(p => {
        const isFinished = statusIds.includes(p.id) || (checkField === 'submit' && p.id === myId && hasSubmitted);
        return (
          <div key={p.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            opacity: isFinished ? 1 : 0.4,
            filter: isFinished ? 'none' : 'grayscale(100%)',
            transition: 'all 0.3s'
          }}>
            <img src={`/avatars/${p.avatarId}.png`} alt="p" style={{width: isTvDisplay ? '70px' : '45px', height: isTvDisplay ? '70px' : '45px', borderRadius: '0', objectFit: 'contain'}} onError={(e) => e.target.src = '/avatars/1.png'}/>
            <span style={{fontSize: isTvDisplay ? '1.1rem' : '0.8rem', fontWeight: 'bold', color: '#3E2723', marginTop: '5px'}}>{p.username}</span>
          </div>
        );
      })}
    </div>
  );
  };

  useEffect(() => {
    setFakeAnswer("");
    setSelectedOptionIndex(null);
  }, [roundData?.question]);

  if (!roundData) return <div className="full-screen-container"><h1 className="waiting-text">جارِ التحميل...</h1></div>;

  // ========== 1. CATEGORY_SELECT ==========
  if (phase === 'CATEGORY_SELECT') {
    const amITurn = myId === roundData.turnPlayerId;

    // TV Display: show categories big, only turn player can select from their phone
    if (isTvDisplay) {
      return (
        <div className={`full-screen-container${tvClass}`} style={{ justifyContent: 'center' }}>
          {renderRoundInfo()}
          <div style={{marginBottom: '20px'}}>
            <img src={`/avatars/${roundData.turnPlayerAvatarId}.png`} alt="avatar" style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => e.target.src = '/avatars/1.png'}/>
          </div>
          <h2 style={{ color: '#E65100', fontSize: '3rem', fontWeight: '900', margin: '0 0 30px 0', textShadow: '0 2px 0 rgba(255,255,255,0.5)' }}>
            دور: {roundData.turnPlayerName}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', width: '90%', maxWidth: '900px' }}>
            {roundData.categories.map((catKey) => (
              <div key={catKey} style={{
                backgroundColor: '#009688', color: 'white', padding: '25px 40px',
                fontSize: '2rem', fontWeight: 'bold', borderRadius: '15px',
                boxShadow: '0 6px 0 #00796B', minWidth: '200px', textAlign: 'center'
              }}>
                {getCategoryName(catKey)}
              </div>
            ))}
          </div>
          <p style={{color: '#5D4037', fontWeight: 'bold', marginTop: '30px', fontSize: '1.5rem'}}>
            {roundData.turnPlayerName} يختار من جهازه...
          </p>
        </div>
      );
    }

    // Normal / TV Player: can select if it's their turn
    return (
      <div className="full-screen-container" style={{ justifyContent: 'center' }}>
        {renderRoundInfo()}
        <div style={{marginBottom: '15px'}}>
          <img src={`/avatars/${roundData.turnPlayerAvatarId}.png`} alt="avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => e.target.src = '/avatars/1.png'}/>
        </div>
        <h2 style={{ color: '#E65100', fontSize: '2rem', fontWeight: '900', margin: '0 0 25px 0', textShadow: '0 2px 0 rgba(255,255,255,0.5)' }}>
          {amITurn ? 'دورك تختار!' : `دور: ${roundData.turnPlayerName}`}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '90%', maxWidth: '350px', alignItems: 'center' }}>
          {roundData.categories.map((catKey) => (
            <button key={catKey} onClick={() => amITurn && onSelectCategory(catKey)} disabled={!amITurn}
              style={{
                backgroundColor: '#009688', color: 'white', border: 'none', padding: '15px 20px',
                fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '10px', width: '100%',
                transition: 'transform 0.1s', cursor: amITurn ? 'pointer' : 'default',
                boxShadow: amITurn ? '0 4px 0 #00796B' : 'none',
                opacity: amITurn ? 1 : 0.6, transform: amITurn ? 'none' : 'scale(0.98)'
              }}>
              {getCategoryName(catKey)}
            </button>
          ))}
          {!amITurn && <p style={{color: '#5D4037', fontWeight: 'bold', marginTop: '10px'}}>بيفكر يختار إيه...</p>}
        </div>
      </div>
    );
  }

  // ========== 2. WRITING ==========
  if (phase === 'WRITING') {
    const isInputEmpty = !fakeAnswer.trim();
    const submittedIds = roundData.submittedIds || [];

    // TV Display: show question big, waiting for players
    if (isTvDisplay) {
      return (
        <>
        <ImageZoomOverlay src={zoomedImg} onClose={() => setZoomedImg(null)} />
        <div className={`full-screen-container${tvClass}`} style={{justifyContent: 'flex-start', paddingTop: '10px'}}>
          <div className="timer-bar-container" style={{width: '100%', height: '15px', backgroundColor: '#eee', position: 'absolute', top: 0, left: 0}}>
            <div className="timer-bar-fill" key={`writing-tv-${roundData?.roundNumber}`} style={{
              height: '100%', backgroundColor: '#E65100', width: '100%',
              animation: `timerAnimation ${roundData?.time || settings?.timePerRound || 45}s linear forwards`
            }}></div>
          </div>
          {renderRoundInfo()}
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: '30px'}}>
            <h3 style={{color: '#E65100', margin: '0 0 15px 0', fontSize: '2.5rem'}}>
              {getCategoryName(roundData.categoryKey)}
            </h3>
            {roundData.img && (
              <div onClick={() => setZoomedImg(roundData.img)} style={{margin: '15px auto', width: '400px', height: '400px', overflow: 'hidden', backgroundColor: 'transparent', cursor: 'pointer'}}>
                <img src={roundData.img} alt="Question" loading="eager" decoding="async" fetchpriority="high" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
              </div>
            )}
            <h2 style={{ color: '#E65100', fontSize: '2.8rem', fontWeight: 'bold', textAlign: 'center', marginTop: '15px', marginBottom: '40px' }}>
              {roundData.question}
            </h2>
            <div style={{backgroundColor: 'rgba(0,0,0,0.1)', padding: '15px 40px', borderRadius: '15px'}}>
              <p style={{color: '#5D4037', fontSize: '1.8rem', fontWeight: 'bold', margin: 0}}>
                {submittedIds.length}/{activeCount} جاوبوا
              </p>
            </div>
          </div>
          {renderPlayerStatus(submittedIds, 'submit')}
        </div>
        </>
      );
    }

    // Normal / TV Player: show question + input
    return (
      <>
      <ImageZoomOverlay src={zoomedImg} onClose={() => setZoomedImg(null)} />
      <div className="full-screen-container" style={{justifyContent: 'flex-start', paddingTop: '10px'}}>
        <div className="timer-bar-container" style={{width: '100%', height: '10px', backgroundColor: '#eee', position: 'absolute', top: 0, left: 0}}>
          <div className="timer-bar-fill" key={`writing-${roundData?.roundNumber}`} style={{
            height: '100%', backgroundColor: '#E65100', width: '100%',
            animation: `timerAnimation ${roundData?.time || settings?.timePerRound || 45}s linear forwards`
          }}></div>
        </div>
        {renderRoundInfo()}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: '20px'}}>
          <h3 style={{color: '#E65100', margin: '0 0 10px 0', fontSize: '1.5rem'}}>
            {getCategoryName(roundData.categoryKey)}
          </h3>
          {roundData.img && (
            <div onClick={() => setZoomedImg(roundData.img)} style={{margin: '10px auto', width: '220px', height: '220px', overflow: 'hidden', backgroundColor: 'transparent', cursor: 'pointer'}}>
              <img src={roundData.img} alt="Question" loading="eager" decoding="async" fetchpriority="high" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
            </div>
          )}
          <h2 style={{ color: '#E65100', fontSize: '1.8rem', fontWeight: 'bold', textAlign: 'center', marginTop: '10px', marginBottom: '50px' }}>
            {roundData.question}
          </h2>
          {!hasSubmitted ? (
            <div style={{width: '90%', maxWidth: '350px', display:'flex', flexDirection:'column', gap:'15px', alignItems: 'center'}}>
              <input type="text" className="game-input" placeholder="اكتب كذبة مقنعة..." value={fakeAnswer}
                onChange={(e) => setFakeAnswer(e.target.value)}
                style={{ fontSize: '1.1rem', padding: '15px', width: '100%', boxSizing: 'border-box', backgroundColor: '#FFF9C4', border: 'none', borderRadius: '10px', color: '#5D4037', textAlign: 'center', fontWeight: 'bold' }}/>
              <button className="action-btn" disabled={isInputEmpty} onClick={() => onSubmitFake(fakeAnswer)}
                style={{ padding: '12px 40px', fontSize: '1.1rem', backgroundColor: isInputEmpty ? '#ccc' : '#009688', borderRadius: '8px', color: 'white', border: 'none' }}>
                جاوب
              </button>
            </div>
          ) : (
            <div className="waiting-box"><p className="waiting-text">تم الإرسال! </p></div>
          )}
        </div>
        {!isTvPlayer && renderPlayerStatus(submittedIds, 'submit')}
      </div>
      </>
    );
  }

  // ========== 3. GUESSING ==========
  if (phase === 'GUESSING') {
    const votedIds = roundData.votedIds || [];
    const iHaveVoted = votedIds.includes(myId);

    // TV Display: show options big (no interaction, players vote from phones)
    if (isTvDisplay) {
      return (
        <div className={`full-screen-container${tvClass}`} style={{justifyContent: 'flex-start', paddingTop: '10px'}}>
          <div className="timer-bar-container" style={{width: '100%', height: '15px', backgroundColor: '#eee', position: 'absolute', top: 0, left: 0}}>
            <div className="timer-bar-fill" key={`guessing-tv-${roundData?.roundNumber}`} style={{
              height: '100%', backgroundColor: '#E65100', width: '100%',
              animation: `timerAnimation ${roundData?.time || settings?.timePerRound || 45}s linear forwards`
            }}></div>
          </div>
          {renderRoundInfo()}
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '30px'}}>
            <h2 style={{ color: '#E65100', fontSize: '2.8rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '40px' }}>
              {roundData.question}
            </h2>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', width: '90%', maxWidth: '1000px'}}>
              {roundData.options && roundData.options.map((opt, i) => (
                <div key={i} style={{
                  backgroundColor: '#009688', color: 'white', padding: '25px 40px',
                  fontSize: '2rem', fontWeight: 'bold', borderRadius: '15px',
                  boxShadow: '0 6px 0 #00796B', minWidth: '250px', textAlign: 'center',
                  flex: '1 1 40%'
                }}>
                  {opt.text}
                </div>
              ))}
            </div>
            <div style={{backgroundColor: 'rgba(0,0,0,0.1)', padding: '15px 40px', borderRadius: '15px', marginTop: '30px'}}>
              <p style={{color: '#5D4037', fontSize: '1.8rem', fontWeight: 'bold', margin: 0}}>
                {votedIds.length}/{activeCount} صوتوا
              </p>
            </div>
          </div>
          {renderPlayerStatus(votedIds, 'vote')}
        </div>
      );
    }

    // Normal / TV Player: vote from phone
    return (
      <div className="full-screen-container" style={{justifyContent: 'flex-start', paddingTop: '10px'}}>
        <div className="timer-bar-container" style={{width: '100%', height: '10px', backgroundColor: '#eee', position: 'absolute', top: 0, left: 0}}>
          <div className="timer-bar-fill" key={`guessing-${roundData?.roundNumber}`} style={{
            height: '100%', backgroundColor: '#E65100', width: '100%',
            animation: `timerAnimation ${roundData?.time || settings?.timePerRound || 45}s linear forwards`
          }}></div>
        </div>
        {renderRoundInfo()}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '20px'}}>
          {!iHaveVoted ? (
            <>
              <h2 style={{ color: '#E65100', fontSize: '1.8rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '30px', marginTop: '0' }}>
                {roundData.question}
              </h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '90%', maxWidth: '350px'}}>
                {roundData.options && roundData.options.map((opt, i) => {
                  const isSelected = selectedOptionIndex === i;
                  return (
                    <button key={i} onClick={() => { setSelectedOptionIndex(i); onVote(opt); }} disabled={selectedOptionIndex !== null}
                      style={{
                        backgroundColor: isSelected ? '#00796B' : '#009688', color: 'white', border: 'none', padding: '15px',
                        fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '10px',
                        cursor: selectedOptionIndex !== null ? 'default' : 'pointer',
                        transform: isSelected ? 'scale(0.98)' : 'none',
                        boxShadow: '0 4px 0 rgba(0,0,0,0.1)', transition: 'all 0.1s'
                      }}>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="waiting-box" style={{textAlign: 'center'}}>
              <p style={{fontSize: '4rem', margin: 0}}></p>
              <h3 style={{color: '#E65100'}}>تم التصويت!</h3>
              <p style={{color: '#555', fontSize: '1.2rem'}}>في انتظار باقي اللاعبين...</p>
            </div>
          )}
        </div>
        {!isTvPlayer && (
          <div style={{display: 'flex', gap: '15px', justifyContent: 'center', paddingBottom: '20px', width: '100%', flexWrap: 'wrap'}}>
            {players.map(p => {
              const hasFinishedVoting = votedIds.includes(p.id);
              return (
                <div key={p.id} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  opacity: hasFinishedVoting ? 1 : 0.4, filter: hasFinishedVoting ? 'none' : 'grayscale(100%)', transition: 'all 0.3s'
                }}>
                  <img src={`/avatars/${p.avatarId}.png`} alt="p" style={{width: '45px', height: '45px', borderRadius: '0', objectFit: 'contain'}} onError={(e) => e.target.src = '/avatars/1.png'}/>
                  <span style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#3E2723', marginTop: '-5px'}}>{p.username}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ========== 4. ROUND_RESULTS ==========
  if (phase === 'ROUND_RESULTS') {
    return (
      <div className={`full-screen-container${tvClass}`} style={{justifyContent: 'flex-start', paddingTop: '40px'}}>
        {renderRoundInfo()}
        <div style={{marginBottom: isTvDisplay ? '30px' : '25px', padding: '0 20px', marginTop: '40px', textAlign: 'center'}}>
          <h2 style={{color:'#E65100', fontSize: isTvDisplay ? '2.5rem' : '1.5rem', margin:0, fontWeight:'bold', lineHeight: '1.4'}}>
            {roundData.question}
          </h2>
        </div>
        <div className={`results-grid-unified${isTvDisplay ? ' tv-results' : ''}`}>
          {roundData.resultsOptions && roundData.resultsOptions.map((opt, i) => {
            const isReal = opt.type === 'REAL';
            const sourceText = isReal ? "الإجابة الصحيحة! " : `إجابة ${opt.ownerName}`;
            return (
              <div key={i} className="result-card-teal" style={{
                border: isReal ? '4px solid #FFD700' : '3px solid rgba(255,255,255,0.15)',
                backgroundColor: isReal ? '#00796B' : '#009688',
                fontSize: isTvDisplay ? '1.5rem' : undefined,
                padding: isTvDisplay ? '25px' : undefined
              }}>
                <div className="card-content-text" style={{fontSize: isTvDisplay ? '2rem' : undefined}}>
                  {opt.text}
                </div>
                <div className="card-source-text" style={{fontSize: isTvDisplay ? '1.2rem' : undefined}}>
                  {sourceText}
                </div>
                {opt.voters && opt.voters.map((v, idx) => {
                  const posIndex = idx % 5;
                  return (
                    <div key={idx} className={`voter-random-wrapper pos-${posIndex}`}>
                      <img src={`/avatars/${v.avatarId || 1}.png`} alt={v.username} className="voter-avatar-random"
                        style={isTvDisplay ? {width: '50px', height: '50px'} : undefined}
                        onError={(e) => e.target.src = '/avatars/1.png'}/>
                      <span className="voter-name-random" style={isTvDisplay ? {fontSize: '1rem'} : undefined}>{v.username}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 'auto', marginBottom: '30px', width:'100%', display:'flex', justifyContent:'center'}}>
          {isHost ? (
            <button className="action-btn" onClick={onShowScoreboard} style={{width: isTvDisplay ? '300px' : '200px', backgroundColor: '#E65100', fontSize: isTvDisplay ? '1.8rem' : undefined, padding: isTvDisplay ? '20px' : undefined}}>
              النتائج
            </button>
          ) : (
            <p className="waiting-text" style={{fontSize:'1rem'}}>في انتظار القائد...</p>
          )}
        </div>
      </div>
    );
  }

  // ========== 5. SCOREBOARD ==========
  if (phase === 'SCOREBOARD') {
    const allScoreboardPlayers = roundData.players || [];
    const sortedPlayers = (tvMode ? allScoreboardPlayers.filter(p => !p.isHost) : allScoreboardPlayers).sort((a, b) => b.score - a.score);
    const totalRounds = roundData.totalRounds || 10;
    const scaleMax = Math.max(totalRounds * 3, 10);
    const ROW_HEIGHT = isTvDisplay ? 130 : 110;
    const TOP_OFFSET = 30;
    const paperHeight = sortedPlayers.length * ROW_HEIGHT + TOP_OFFSET + 20;

    return (
      <div className={`full-screen-container${tvClass}`}>
        {renderRoundInfo()}
        <h2 style={{color:'#E65100', fontSize: isTvDisplay ? '3rem' : '2rem', margin:'40px 0 20px', fontWeight:'900'}}>النتيجة</h2>
        <div className="scoreboard-frame">
          <div className="scoreboard-paper" style={{ height: `${paperHeight}px` }}>
            {sortedPlayers.map((p, i) => {
              const isNegative = p.score < 0;
              let widthPercent = Math.min(100, (Math.abs(p.score) / scaleMax) * 100);
              if (widthPercent < 8) widthPercent = 8;
              if (p.score === 0) widthPercent = 5;
              const topPosition = i * ROW_HEIGHT + TOP_OFFSET;
              return (
                <div key={p.id} className="score-row" style={{
                  top: `${topPosition}px`,
                  animation: `slideUpFade 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                  animationDelay: `${i * 0.15}s`, opacity: 0
                }}>
                  <div className="score-avatar-wrapper">
                    <img src={`/avatars/${p.avatarId || 1}.png`} alt={p.username} className="score-avatar-img" style={isTvDisplay ? {width:'70px', height:'70px'} : undefined}/>
                    <span className="score-player-name" style={isTvDisplay ? {fontSize:'1.3rem'} : undefined}>{p.username}</span>
                  </div>
                  <div className="score-bar-track">
                    <div className={`score-bar-fill${isNegative ? ' negative' : ''}`} style={{
                      width: `${widthPercent}%`,
                      animation: `growBarElastic 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, barShimmer 2.5s ease-in-out 1.5s infinite`,
                      animationDelay: `${i * 0.15 + 0.2}s`
                    }}>
                      <span className="score-text" style={{
                        animation: `popNumber 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
                        animationDelay: `${i * 0.15 + 1}s`, opacity: 0,
                        color: isNegative ? '#f44336' : 'white',
                        fontSize: isTvDisplay ? '1.8rem' : undefined
                      }}>
                        {p.score}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{marginTop: '20px', height: '80px'}}>
          {isHost ? (
            <button className="action-btn" onClick={onNextRound} style={isTvDisplay ? {fontSize:'1.8rem', padding:'18px 40px'} : undefined}>الجولة التالية ➡</button>
          ) : (
            <p className="waiting-text">القائد يراجع النتائج...</p>
          )}
        </div>
      </div>
    );
  }

  // ========== 6. GAME_OVER ==========
  if (phase === 'GAME_OVER') {
    const winner = fixedWinner || [...players].sort((a, b) => b.score - a.score)[0];
    return (
      <div className="full-screen-container" style={{backgroundColor: '#E91E63'}}>
        <h1 style={{color: '#FDD835', fontSize: '3rem', marginBottom: '20px'}}>
          {winner?.username || 'الفائز'}
        </h1>
      </div>
    );
  }

  return null;
};

const ImageZoomOverlay = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
        position: 'absolute', top: '15px', left: '15px',
        background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
        fontSize: '2rem', width: '50px', height: '50px', borderRadius: '50%',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000
      }}>✕</button>
      <img src={src} alt="Zoomed" style={{
        maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain'
      }} onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

export default GameScreen;
