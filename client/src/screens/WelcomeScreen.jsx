import { useState, useEffect } from 'react';
import gameLogo from '../assets/logo.png';
import SeoSection from '../components/SeoSection';

const WelcomeScreen = ({ onJoinGame, initialCode }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState(""); 
  
  // 1. عدد الصور المتاح لديك
  const TOTAL_AVATARS = 13;

  // 2. اختيار رقم عشوائي عند البداية
  const [avatarId, setAvatarId] = useState(() => Math.floor(Math.random() * TOTAL_AVATARS) + 1);
  
  const [isJoinMode, setIsJoinMode] = useState(false); 

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
        <div style={{width: '100%', display:'flex', flexDirection:'column', alignItems:'center'}}>
          <img 
            src={gameLogo}
            alt="دبسهم" 
            style={{ 
              width: '60%', // حجم أصغر شوية في القائمة
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

      // ... باقي كود الأزرار واللوجو ...

{/* 👇 ضيف السطر ده في الآخر */}
<SeoSection />
  
    </div>
  );
};

export default WelcomeScreen;