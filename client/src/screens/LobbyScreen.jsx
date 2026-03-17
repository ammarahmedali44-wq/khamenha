import React, { useState } from 'react';
import QRCode from "react-qr-code";
// 👇 استيراد قائمة الفئات الموحدة
import { categoriesList } from "../categoriesList"; 

const InfoBox = ({ title, badge, children, isOpen, onToggle }) => {
  return (
    <div className="info-box-container">
      <div className="info-box-header" onClick={onToggle}>
        <span>{badge}</span>
        <span>{title}</span>
        <span style={{fontSize:'0.8rem'}}>{isOpen ? '▼' : '◀'}</span>
      </div>
      {isOpen && <div className="info-box-content">{children}</div>}
    </div>
  );
};

const LobbyScreen = ({ players = [], onStartGame, roomCode, isHostOverride, settings, onUpdateSettings }) => {
  const amIHost = isHostOverride;
  // حالة الأقسام (باركود، لاعبين، فئات، إعدادات)
  const [sections, setSections] = useState({ qr: true, players: true, categories: true, settings: true });
  const [showTvQR, setShowTvQR] = useState(false);
  const toggleSection = (s) => setSections(prev => ({ ...prev, [s]: !prev[s] }));

  // استخدام القائمة المستوردة
  const allCategories = categoriesList;

  const toggleCategory = (catId) => {
    if (!amIHost) return;
    const currentSelected = settings?.selectedCategories || [];
    let newSelected;
    if (currentSelected.includes(catId)) {
      newSelected = currentSelected.filter(id => id !== catId);
    } else {
      newSelected = [...currentSelected, catId];
    }
    if(onUpdateSettings) onUpdateSettings({ selectedCategories: newSelected });
  };

  const changeTime = (e) => {
    const val = parseInt(e.target.value) || 0;
    if(onUpdateSettings) onUpdateSettings({ timePerRound: val });
  };

  const changeRounds = (e) => {
    const val = Math.max(1, Math.min(35, parseInt(e.target.value) || 1));
    if(onUpdateSettings) onUpdateSettings({ totalRounds: val });
  };

  return (
    <div className="full-screen-container scrollable">
      
      <h2 className="section-title" style={{fontSize:'1.5rem', margin:'15px 0 5px 0'}}>امسح للعب</h2>
      
      {/* 1. قسم الباركود وكود الغرفة */}
      <InfoBox 
        isOpen={sections.qr} 
        onToggle={() => toggleSection('qr')}
        title="" 
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
          
         <div className="qr-box-style">
  <QRCode 
    value={`${window.location.origin}/?room=${roomCode}`} 
    size={120} // أو 256
  />
</div>
          
          <div style={{textAlign: 'center', marginTop: '5px'}}>
            <p style={{margin: 0, fontWeight: 'bold', color: '#3E2723', fontSize: '1rem'}}>
              كود الغرفة:
            </p>
            <p 
              className="allow-copy"
              style={{
                margin: '5px 0 0 0', 
                fontSize: '2.5rem', 
                fontWeight: '900', 
                color: '#E65100', 
                letterSpacing: '5px',
                fontFamily: 'monospace',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (roomCode) {
                    navigator.clipboard.writeText(roomCode);
                    alert("تم نسخ كود الغرفة! ");
                }
              }}
              title="اضغط للنسخ"
            >
              {roomCode || "..."}
            </p>
            <p style={{margin: '5px 0 0 0', fontSize: '0.8rem', color: '#666'}}>
              (اضغط على الكود لنسخه)
            </p>
          </div>  

        </div>
      </InfoBox>

      {/* 2. قسم اللاعبين (تمت استعادته ✅) */}
      <h2 className="section-title">اللاعبين</h2>
      <InfoBox
        badge={`${players.length}`}
        isOpen={sections.players}
        onToggle={() => toggleSection('players')}
      >
        <div className="mini-players-grid">
          {players.map((p) => (
            <div key={p.id || Math.random()} className="mini-player">
              <img
                src={`/avatars/${p.avatarId}.png`}
                alt="p"
                onError={(e) => e.target.src = '/avatars/1.png'}
              />
              <span className="player-name-tag">{p.username}{p.isHost ? ' (المنظم)' : ''}</span>
            </div>
          ))}
        </div>
      </InfoBox>
      
      {/* 3. قسم الفئات (نسخة واحدة فقط ✅) */}
      <h2 className="section-title">الفئات</h2>
      <InfoBox 
        badge={`${settings?.selectedCategories?.length || 0}/${allCategories.length}`}
        isOpen={sections.categories} 
        onToggle={() => toggleSection('categories')}
      >
        <div className="categories-grid">
          {allCategories.map((cat) => {
            const isSelected = settings?.selectedCategories?.includes(cat.id);
            return (
              <div 
                key={cat.id} 
                onClick={() => toggleCategory(cat.id)}
                className={`cat-btn-style ${isSelected ? 'active' : ''} ${!amIHost ? 'locked' : ''}`}
              >
                {cat.name}
              </div>
            );
          })}
        </div>
      </InfoBox>

      {/* 4. قسم الإعدادات */}
      <h2 className="section-title">الاعدادات</h2>
      <InfoBox isOpen={sections.settings} onToggle={() => toggleSection('settings')}>
        <div className="settings-row">
          <span style={{fontWeight:'bold', color:'#E65100'}}>مدة الجولة:</span>
          <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
             <input
              type="number"
              value={settings?.timePerRound || 45}
              onChange={changeTime}
              className="time-input-style"
              disabled={!amIHost}
              min="10"
              max="120"
            />
            <span style={{color:'#E65100', fontWeight:'bold'}}>ثانية</span>
          </div>
        </div>
        <div className="settings-row">
          <span style={{fontWeight:'bold', color:'#E65100'}}>عدد الجولات:</span>
          <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
             <input
              type="number"
              value={settings?.totalRounds || 10}
              onChange={changeRounds}
              className="time-input-style"
              disabled={!amIHost}
              min="1"
              max="35"
            />
            <span style={{color:'#E65100', fontWeight:'bold'}}>جولة</span>
          </div>
        </div>
        <div className="settings-row">
          <span style={{fontWeight:'bold', color:'#E65100'}}>وضع التلفاز:</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings?.tvMode || false}
              onChange={(e) => {
                if (!amIHost) return;
                const newVal = e.target.checked;
                onUpdateSettings({ tvMode: newVal });
                if (newVal) setShowTvQR(true);
              }}
              disabled={!amIHost}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </InfoBox>

      {/* TV Mode QR Code Popup */}
      {showTvQR && settings?.tvMode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.85)', zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <button onClick={() => setShowTvQR(false)} style={{
            position: 'absolute', top: '25px', left: '25px',
            background: '#f44336', color: 'white', border: 'none',
            width: '50px', height: '50px', borderRadius: '50%',
            fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100000
          }}>✕</button>
          <h2 style={{color: '#FFD700', fontSize: '2.5rem', marginBottom: '30px', fontWeight: '900', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
            امسح للانضمام
          </h2>
          <div style={{background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)'}}>
            <QRCode value={`${window.location.origin}/?room=${roomCode}`} size={280} />
          </div>
          <p style={{
            color: 'white', fontSize: '3rem', fontWeight: '900',
            letterSpacing: '8px', fontFamily: 'monospace', marginTop: '25px',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            {roomCode}
          </p>
          <p style={{color: '#aaa', fontSize: '1.2rem', marginTop: '10px'}}>
            وضع التلفاز مفعل - القائد يعرض فقط
          </p>
        </div>
      )}

      <div style={{marginTop: '20px', marginBottom: '50px'}}>
        {amIHost ? (
          <button 
            className="action-btn-green" 
            onClick={() => onStartGame && onStartGame()}
            disabled={players.length < 1} 
            style={players.length < 1 ? {opacity: 0.5, cursor: 'not-allowed'} : {}}
          >
             يلا 
          </button>
        ) : (
          <p className="waiting-text">في انتظار القائد...</p>
        )}
      </div>

    </div>
  );
};

export default LobbyScreen;