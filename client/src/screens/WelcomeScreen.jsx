import { useState, useEffect } from 'react';
import gameLogo from '../assets/logo.png';

const WelcomeScreen = ({ onJoinGame, initialCode }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState(""); 
  
  // 1. عدد الصور المتاح لديك
  const TOTAL_AVATARS = 13;

  // 2. اختيار رقم عشوائي عند البداية
  const [avatarId, setAvatarId] = useState(() => Math.floor(Math.random() * TOTAL_AVATARS) + 1);
  
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    if (initialCode && !isJoinMode) {
      setCode(initialCode);
    }
  }, [initialCode, isJoinMode]);

  const nextAvatar = () => {
    setAvatarId((prev) => (prev === TOTAL_AVATARS ? 1 : prev + 1));
  };

  const prevAvatar = () => {
    setAvatarId((prev) => (prev === 1 ? TOTAL_AVATARS : prev - 1));
  };

  const handleCreateRoom = () => {
    setIsJoinMode(false); 
    setCode(initialCode || "");
    setStep(3);
  };

  const handleJoinOnline = () => {
    setIsJoinMode(true); 
    setCode("");
    setStep(3);
  };

  const handleJoin = () => {
    if (!username.trim()) return alert("اكتب اسمك الأول");
    if (isJoinMode && code.length !== 6) return alert("الكود لازم يكون 6 أرقام");
    onJoinGame({ username, avatarId, codeInput: code, isJoinMode });
  };

  return (
    <div className="full-screen-container">
      
      {step === 1 && (
        <div 
          onClick={() => setStep(2)} 
          style={{
            cursor: 'pointer', 
            transform: 'scale(1.1)',
            display: 'flex',            // 👈 التعديل: تفعيل الفليكس
            flexDirection: 'column',    // 👈 التعديل: ترتيب العناصر فوق بعض
            alignItems: 'center',       // 👈 التعديل: سنترة أفقي
            justifyContent: 'center'    // 👈 التعديل: سنترة رأسي
          }}
        >
          <img 
            src={gameLogo}
            alt="دبسهم" 
            style={{ 
              width: '80%', 
              maxWidth: '350px', 
              height: 'auto', 
              marginBottom: '20px',
              filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))'
            }} 
          />
          <p className="waiting-text" style={{ margin: 0 }}>اضغط للمتابعة</p>
        </div>
      )}

      {step === 2 && (
        <div style={{width: '100%', display:'flex', flexDirection:'column', alignItems:'center', position: 'relative'}}>
          <button
            onClick={() => setShowHowToPlay(true)}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FF5722',
              color: 'white',
              border: 'none',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 3px 0 #D84315',
              fontFamily: 'Lalezar, system-ui',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ؟
          </button>
          <img
            src={gameLogo}
            alt="دبسهم"
            style={{
              width: '60%',
              maxWidth: '250px',
              height: 'auto',
              marginBottom: '30px',
              filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))'
            }}
          />
          <button className="menu-btn" onClick={handleCreateRoom}>إنشاء غرفة</button>
          <button className="menu-btn" onClick={handleJoinOnline}>ادخل غرفة </button>
        </div>
      )}

      {showHowToPlay && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setShowHowToPlay(false)}
        >
          <div
            style={{
              background: '#FFF9C4', width: '90%', maxWidth: '350px',
              borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              overflow: 'hidden', border: '4px solid #FF5722',
              animation: 'popIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              backgroundColor: '#FF5722', color: 'white', textAlign: 'center',
              padding: '15px', fontSize: '1.5rem', fontWeight: 'bold', margin: 0,
              fontFamily: 'Lalezar, system-ui'
            }}>
              طريقة اللعب
            </h2>
            <div style={{ padding: '20px', direction: 'rtl', textAlign: 'right', lineHeight: '1.8', color: '#3E2723', fontSize: '0.95rem', maxHeight: '400px', overflowY: 'auto' }}>
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
            <div style={{ padding: '15px', display: 'flex', justifyContent: 'center' }}>
              <button
                style={{
                  backgroundColor: '#009688', color: 'white', border: 'none', padding: '12px',
                  width: '100%', borderRadius: '10px', fontWeight: 'bold',
                  cursor: 'pointer', boxShadow: '0 4px 0 #00796B', fontFamily: 'Lalezar, system-ui',
                  fontSize: '1.1rem'
                }}
                onClick={() => setShowHowToPlay(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{width: '100%', display:'flex', flexDirection:'column', alignItems:'center'}}>
          <button className="back-btn" onClick={() => setStep(2)}>رجوع</button>
          <h2 className="title-text">اختار شخصيتك</h2>
          
          <div className="customizer-layout">
            <button className="arrow-btn" onClick={nextAvatar}>▶</button>
            
            <div className="avatar-center">
              <img 
                src={`/avatars/${avatarId}.png`} 
                alt="Avatar" 
                style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit:'contain',
                    borderRadius: '0'
                }} 
                onError={(e) => { e.target.onerror = null; e.target.src = '/avatars/1.png'; }}
              />
            </div>

            <button className="arrow-btn" onClick={prevAvatar}>◀</button>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:'10px', alignItems:'center'}}>
            {isJoinMode && (
              <input 
                type="text" placeholder="كود الغرفة" className="name-input"
                value={code} onChange={(e) => setCode(e.target.value)} maxLength={6}
              />
            )}
            <input 
              type="text" placeholder="اكتب اسمك" className="name-input"
              value={username} onChange={(e) => setUsername(e.target.value)} maxLength={14}
            />
            <button className="action-btn" onClick={handleJoin}>يلا</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;