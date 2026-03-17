import { useState, useEffect } from 'react';
import { getCategoryName } from '../categoriesList';

const GameScreen = ({ phase, roundData, players, settings, onSubmitFake, onVote, onSelectCategory, myId, hasSubmitted, isHost, onNextRound, onShowScoreboard }) => {
  const [fakeAnswer, setFakeAnswer] = useState("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [fixedWinner, setFixedWinner] = useState(null); 

  useEffect(() => {
    if (phase === 'GAME_OVER' && players.length > 0 && !fixedWinner) {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      setFixedWinner(sorted[0]);
    }
  }, [phase, players, fixedWinner]);

  // 👇 دالة عرض معلومات الجولة (الشريط العلوي)
  const renderRoundInfo = () => (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', // خلفية شفافة عشان الكلام يبان
      padding: '5px 15px',
      borderRadius: '20px',
      color: '#FFF',
      fontWeight: '900',
      fontSize: '1.1rem',
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

  useEffect(() => {
    setFakeAnswer("");
    setSelectedOptionIndex(null); 
  }, [roundData?.question]);

  if (!roundData) return <div className="full-screen-container"><h1 className="waiting-text">جارِ التحميل...</h1></div>;

  // 👇 1. مرحلة اختيار الفئة
  if (phase === 'CATEGORY_SELECT') {
    const amITurn = myId === roundData.turnPlayerId;
    return (
      <div className="full-screen-container" style={{ justifyContent: 'center' }}>
        
        {/* عرض رقم الجولة هنا أيضاً */}
        {renderRoundInfo()}

        <div style={{marginBottom: '15px'}}>
           <img 
             src={`/avatars/${roundData.turnPlayerAvatarId}.png`} 
             alt="avatar" 
             style={{
                 width: '90px', 
                 height: '90px', 
                 borderRadius: '50%',
                 objectFit: 'cover'
             }} 
             onError={(e) => e.target.src = '/avatars/1.png'}
           />
        </div>

        <h2 style={{
            color: '#E65100', 
            fontSize: '2rem', 
            fontWeight: '900', 
            margin: '0 0 25px 0',
            textShadow: '0 2px 0 rgba(255,255,255,0.5)'
        }}>
          {amITurn ? 'دورك تختار!' : `دور: ${roundData.turnPlayerName}`}
        </h2>

        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '90%',
            maxWidth: '350px',
            alignItems: 'center'
        }}>
           
           {roundData.categories.map((catKey) => (
             <button
               key={catKey}
               onClick={() => amITurn && onSelectCategory(catKey)}
               disabled={!amITurn}
               style={{
                  backgroundColor: '#009688', 
                  color: 'white',
                  border: 'none',
                  padding: '15px 20px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  width: '100%',
                  transition: 'transform 0.1s',
                  cursor: amITurn ? 'pointer' : 'default',
                  boxShadow: amITurn ? '0 4px 0 #00796B' : 'none',
                  opacity: amITurn ? 1 : 0.6, 
                  transform: amITurn ? 'none' : 'scale(0.98)'
               }}
             >
               {getCategoryName(catKey)}
             </button>
           ))}

           {!amITurn && (
             <p style={{color: '#5D4037', fontWeight: 'bold', marginTop: '10px'}}>
               بيفكر يختار إيه...
             </p>
           )}
        </div>
      </div>
    );
  }

  // 👇 2. مرحلة الكتابة
  if (phase === 'WRITING') {
    const isInputEmpty = !fakeAnswer.trim();
    const submittedIds = roundData.submittedIds || [];

    return (
      <div className="full-screen-container" style={{justifyContent: 'flex-start', paddingTop: '10px'}}>
        
        {/* شريط الوقت */}
        <div className="timer-bar-container" style={{width: '100%', height: '10px', backgroundColor: '#eee', position: 'absolute', top: 0, left: 0}}>
           <div 
             className="timer-bar-fill" 
             key={`writing-${roundData?.roundNumber}`} 
             style={{
               height: '100%', 
               backgroundColor: '#E65100', 
               width: '100%',
               animation: `timerAnimation ${roundData?.time || settings?.timePerRound || 45}s linear forwards`
           }}></div>
        </div>

        {/* 👇👇👇 إضافة عداد الجولة هنا 👇👇👇 */}
        {renderRoundInfo()}

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: '20px'}}>
            
            <h3 style={{color: '#E65100', margin: '0 0 10px 0', fontSize: '1.5rem'}}>
              {getCategoryName(roundData.categoryKey)}
            </h3>

            {roundData.img && (
              <div style={{margin: '10px auto', width: '220px', height: '220px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f5f5f5'}}>
                <img
                  src={roundData.img}
                  alt="Question"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            )}

            <h2 style={{
                color: '#E65100', fontSize: '1.8rem', fontWeight: 'bold', 
                textAlign: 'center', marginTop: '10px', marginBottom: '50px' 
            }}>
              {roundData.question}
            </h2>

            {!hasSubmitted ? (
              <div style={{width: '90%', maxWidth: '350px', display:'flex', flexDirection:'column', gap:'15px', alignItems: 'center'}}>
                <input 
                  type="text" 
                  className="game-input" 
                  placeholder="اكتب كذبة مقنعة..." 
                  value={fakeAnswer}
                  onChange={(e) => setFakeAnswer(e.target.value)}
                  style={{
                    fontSize: '1.1rem', padding: '15px', width: '100%', boxSizing: 'border-box',
                    backgroundColor: '#FFF9C4', border: 'none', borderRadius: '10px',
                    color: '#5D4037', textAlign: 'center', fontWeight: 'bold'
                  }}
                />
                <button 
                  className="action-btn" 
                  disabled={isInputEmpty} 
                  onClick={() => onSubmitFake(fakeAnswer)}
                  style={{ padding: '12px 40px', fontSize: '1.1rem', backgroundColor: isInputEmpty ? '#ccc' : '#009688', borderRadius: '8px', color: 'white', border: 'none' }} 
                >
                  جاوب
                </button>
              </div>
            ) : (
              <div className="waiting-box">
                 <p className="waiting-text">تم الإرسال! </p>
              </div>
            )}
        </div>

        <div style={{display: 'flex', gap: '15px', justifyContent: 'center', paddingBottom: '20px', width: '100%', flexWrap: 'wrap'}}>
           {players.map(p => {
               const isFinished = submittedIds.includes(p.id) || (p.id === myId && hasSubmitted);
               return (
                 <div key={p.id} style={{
                     display: 'flex', flexDirection: 'column', alignItems: 'center',
                     opacity: isFinished ? 1 : 0.4, 
                     filter: isFinished ? 'none' : 'grayscale(100%)',
                     transition: 'all 0.3s'
                 }}>
                    <img src={`/avatars/${p.avatarId}.png`} alt="p" style={{width: '45px', height: '45px', borderRadius: '0', objectFit: 'contain'}} onError={(e) => e.target.src = '/avatars/1.png'}/>
                    <span style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#3E2723', marginTop: '-5px'}}>{p.username}</span>
                 </div>
               );
           })}
        </div>
      </div>
    );
  }

  // 👇 3. مرحلة التخمين
  if (phase === 'GUESSING') {
    const votedIds = roundData.votedIds || [];
    const iHaveVoted = votedIds.includes(myId);
    const roundDuration = roundData.time || settings?.timePerRound || 45;

    return (
      <div className="full-screen-container" style={{justifyContent: 'flex-start', paddingTop: '10px'}}>
        
        {/* شريط الوقت */}
        <div className="timer-bar-container" style={{width: '100%', height: '10px', backgroundColor: '#eee', position: 'absolute', top: 0, left: 0}}>
           <div 
             className="timer-bar-fill" 
             key={`guessing-${roundData?.roundNumber}`} 
             style={{
               height: '100%', 
               backgroundColor: '#E65100', 
               width: '100%',
               animation: `timerAnimation ${roundData?.time || settings?.timePerRound || 45}s linear forwards`
           }}></div>
        </div>

        {/* 👇👇👇 إضافة عداد الجولة هنا 👇👇👇 */}
        {renderRoundInfo()}

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '20px'}}>

            {!iHaveVoted ? (
              <>
                <h2 style={{
                    color: '#E65100', fontSize: '1.8rem', fontWeight: 'bold', 
                    textAlign: 'center', marginBottom: '30px', marginTop: '0'
                }}>
                  {roundData.question}
                </h2>

                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '90%', maxWidth: '350px'}}>
                  {roundData.options && roundData.options.map((opt, i) => {
                    const isSelected = selectedOptionIndex === i;
                    
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedOptionIndex(i); onVote(opt); }}
                        disabled={selectedOptionIndex !== null}
                        style={{
                          backgroundColor: isSelected ? '#00796B' : '#009688', 
                          color: 'white', border: 'none', padding: '15px',
                          fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '10px',
                          cursor: selectedOptionIndex !== null ? 'default' : 'pointer',
                          transform: isSelected ? 'scale(0.98)' : 'none',
                          boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
                          transition: 'all 0.1s'
                        }}
                      >
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

        <div style={{display: 'flex', gap: '15px', justifyContent: 'center', paddingBottom: '20px', width: '100%', flexWrap: 'wrap'}}>
           {players.map(p => {
               const hasFinishedVoting = votedIds.includes(p.id);
               return (
                 <div key={p.id} style={{
                     display: 'flex', flexDirection: 'column', alignItems: 'center',
                     opacity: hasFinishedVoting ? 1 : 0.4,
                     filter: hasFinishedVoting ? 'none' : 'grayscale(100%)',
                     transition: 'all 0.3s'
                 }}>
                    <img src={`/avatars/${p.avatarId}.png`} alt="p" style={{width: '45px', height: '45px', borderRadius: '0', objectFit: 'contain'}} onError={(e) => e.target.src = '/avatars/1.png'}/>
                    <span style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#3E2723', marginTop: '-5px'}}>{p.username}</span>
                 </div>
               );
           })}
        </div>

      </div>
    );
  }

  // 4. مرحلة النتائج
  if (phase === 'ROUND_RESULTS') {
    return (
      <div className="full-screen-container" style={{justifyContent: 'flex-start', paddingTop: '40px'}}>
        
        {/* 👇👇👇 إضافة عداد الجولة هنا 👇👇👇 */}
        {renderRoundInfo()}

        <div style={{marginBottom: '25px', padding: '0 20px', marginTop: '40px', textAlign: 'center'}}>
            <h2 style={{color:'#E65100', fontSize:'1.5rem', margin:0, fontWeight:'bold', lineHeight: '1.4'}}>
              {roundData.question}
            </h2>
        </div>

        <div className="results-grid-unified">
          {roundData.resultsOptions && roundData.resultsOptions.map((opt, i) => {
            const isReal = opt.type === 'REAL';
            const sourceText = isReal ? "الإجابة الصحيحة! " : `إجابة ${opt.ownerName}`;
            
            return (
              <div key={i} className="result-card-teal" style={{
                  border: isReal ? '4px solid #FFD700' : '3px solid rgba(255,255,255,0.15)',
                  backgroundColor: isReal ? '#00796B' : '#009688'
              }}>
                <div className="card-content-text">
                  {opt.text}
                </div>
                <div className="card-source-text">
                  {sourceText}
                </div>
                {opt.voters && opt.voters.map((v, idx) => {
                  const posIndex = idx % 5;
                  return (
                    <div key={idx} className={`voter-random-wrapper pos-${posIndex}`}>
                       <img 
                         src={`/avatars/${v.avatarId || 1}.png`} 
                         alt={v.username} 
                         className="voter-avatar-random"
                         onError={(e) => e.target.src = '/avatars/1.png'}
                       />
                       <span className="voter-name-random">{v.username}</span>
                    </div>
                  );
                })}
              </div>
            );
          })} 
        </div>

        <div style={{marginTop: 'auto', marginBottom: '30px', width:'100%', display:'flex', justifyContent:'center'}}>
           {isHost ? (
             <button className="action-btn" onClick={onShowScoreboard} style={{width: '200px', backgroundColor: '#E65100'}}>
               النتائج 
             </button>
           ) : (
             <p className="waiting-text" style={{fontSize:'1rem'}}>في انتظار القائد...</p>
           )}
        </div>
      </div>
    );
  }

  // 5. مرحلة عرض النتيجة النهائية (Scoreboard)
  if (phase === 'SCOREBOARD') {
    const sortedPlayers = [...(roundData.players || [])].sort((a, b) => b.score - a.score);
    const totalRounds = roundData.totalRounds || 10;
    // Scale: max possible ~3 points per round, so full bar = totalRounds * 3
    const scaleMax = Math.max(totalRounds * 3, 10);
    const ROW_HEIGHT = 110;
    const TOP_OFFSET = 30;
    const paperHeight = sortedPlayers.length * ROW_HEIGHT + TOP_OFFSET + 20;

    return (
      <div className="full-screen-container">

        {/* 👇👇👇 إضافة عداد الجولة هنا 👇👇👇 */}
        {renderRoundInfo()}

        <h2 style={{color:'#E65100', fontSize:'2rem', margin:'40px 0 20px', fontWeight:'900'}}>النتيجة</h2>

        <div className="scoreboard-frame">
          <div className="scoreboard-paper" style={{ height: `${paperHeight}px` }}>
            {sortedPlayers.map((p, i) => {
              const isNegative = p.score < 0;
              // Bar width based on absolute score relative to scale max
              // Minimum 8% so the bar is always visible, max 100%
              let widthPercent = Math.min(100, (Math.abs(p.score) / scaleMax) * 100);
              if (widthPercent < 8) widthPercent = 8;
              if (p.score === 0) widthPercent = 5;
              const topPosition = i * ROW_HEIGHT + TOP_OFFSET;

              return (
                <div key={p.id} className="score-row" style={{
                    top: `${topPosition}px`,
                    animation: `slideUpFade 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                    animationDelay: `${i * 0.15}s`,
                    opacity: 0
                }}>
                  <div className="score-avatar-wrapper">
                    <img src={`/avatars/${p.avatarId || 1}.png`} alt={p.username} className="score-avatar-img" />
                    <span className="score-player-name">{p.username}</span>
                  </div>

                  <div className="score-bar-track">
                    <div className={`score-bar-fill${isNegative ? ' negative' : ''}`} style={{
                        width: `${widthPercent}%`,
                        animation: `growBarElastic 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, barShimmer 2.5s ease-in-out 1.5s infinite`,
                        animationDelay: `${i * 0.15 + 0.2}s`
                    }}>
                      <span className="score-text" style={{
                          animation: `popNumber 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
                          animationDelay: `${i * 0.15 + 1}s`,
                          opacity: 0,
                          color: isNegative ? '#f44336' : 'white'
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
             <button className="action-btn" onClick={onNextRound}>الجولة التالية ➡</button>
           ) : (
             <p className="waiting-text">القائد يراجع النتائج...</p>
           )}
        </div>
      </div>
    );
  }

  // 👇 6. مرحلة نهاية اللعبة (GAME_OVER)
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

export default GameScreen;