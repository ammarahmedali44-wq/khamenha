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
            <QRCode value={window.location.href} size={120} />
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
        badge={`${players.length}/6`}
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
              <span className="player-name-tag">{p.username}</span>
            </div>
          ))}
          {/* خانات فارغة لإكمال الشكل */}
          {Array.from({ length: Math.max(0, 6 - players.length) }).map((_, i) => (
             <div key={`empty-${i}`} className="mini-player empty-slot">
               <div className="empty-circle"></div>
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
      </InfoBox>

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