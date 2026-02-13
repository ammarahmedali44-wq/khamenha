import React, { useState } from 'react';

const SeoFooter = () => {
  // حالة عشان نعرف انهي جزء مفتوح
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const sections = [
    {
      title: "عن دبيسهم",
      content: "دبيسهم هي لعبة جماعية أونلاين مجانية تعتمد على الذكاء والخداع. العب مع أصدقائك عبر المتصفح بدون تحميل، ألف إجابات مضحكة، واكشف الحقيقة لتفوز."
    },
    {
      title: "طريقة اللعب",
      content: "1. انشئ غرفة وشارك الكود. 2. أكتب إجابة مقنعة للسؤال الغريب. 3. حاول اكتشاف الإجابة الصحيحة من بين تأليفات أصدقائك. 4. جمع النقاط واكسب التحدي."
    },
    {
      title: "الأسئلة الشائعة",
      content: "هل اللعبة مجانية؟ نعم بالكامل. هل تحتاج تطبيق؟ لا، تعمل على أي متصفح. ما عدد اللاعبين؟ من 3 إلى 8 لاعبين لأفضل تجربة."
    }
  ];

  return (
    <div style={styles.footerContainer}>
      <div style={styles.footerContent}>
        
        {/* اللوجو وحقوق الملكية */}
        <div style={styles.branding}>
          <h3 style={styles.logoText}>دبيسهم</h3>
          <p style={styles.copyright}>© 2024 Dabbeshom. All rights reserved.</p>
        </div>

        {/* القوائم (زي موقع Meta) */}
        <div style={styles.linksContainer}>
          {sections.map((section, index) => (
            <div key={index} style={styles.section}>
              <button 
                onClick={() => toggleSection(index)}
                style={styles.headerBtn}
              >
                {section.title}
                <span style={{ transform: openSection === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>
                  ▼
                </span>
              </button>
              
              <div style={{
                ...styles.textBody,
                maxHeight: openSection === index ? '200px' : '0',
                opacity: openSection === index ? '1' : '0',
                marginBottom: openSection === index ? '10px' : '0'
              }}>
                {section.content}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

// الستايل (CSS in JS) عشان نضمن الشكل يطلع مظبوط
const styles = {
  footerContainer: {
    width: '100%',
    backgroundColor: 'rgba(62, 39, 35, 0.1)', // لون بني خفيف جداً وشفاف
    borderTop: '1px solid rgba(62, 39, 35, 0.2)',
    marginTop: 'auto', // يزق نفسه لتحت
    padding: '20px 0',
    fontSize: '0.9rem',
    color: '#3E2723',
    direction: 'rtl'
  },
  footerContent: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px'
  },
  branding: {
    flex: '1',
    minWidth: '200px',
    textAlign: 'right'
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  copyright: {
    fontSize: '0.75rem',
    opacity: 0.7
  },
  linksContainer: {
    flex: '2',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'flex-end'
  },
  section: {
    minWidth: '150px',
  },
  headerBtn: {
    background: 'none',
    border: 'none',
    color: '#3E2723',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 0',
    fontFamily: 'inherit'
  },
  textBody: {
    fontSize: '0.85rem',
    lineHeight: '1.5',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
    maxWidth: '250px',
    textAlign: 'right',
    color: '#5D4037'
  }
};

export default SeoFooter;