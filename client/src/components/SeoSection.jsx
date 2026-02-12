import React from 'react';
import '../App.css'; // عشان نستخدم نفس الستايل

const SeoSection = () => {
  return (
    <div className="seo-container" style={{ padding: '40px 20px', color: '#3E2723', background: 'rgba(255,255,255,0.8)', marginTop: '50px', borderRadius: '20px' }}>
      
      {/* عنوان رئيسي قوي */}
      <h1 style={{ fontSize: '2rem', marginBottom: '20px', textAlign: 'center' }}>
        لعبة دبيسهم - تحدي الخداع والمعلومات العامة مع الأصدقاء
      </h1>

      <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
        
        {/* نبذة عن اللعبة */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>ما هي لعبة دبيسهم؟</h2>
          <p>
            دبيسهم هي <strong>لعبة جماعية أونلاين</strong> مجانية تعتمد على الذكاء، الخداع، وسرعة البديهة. 
            الهدف ليس فقط معرفة الإجابة الصحيحة، بل تأليف إجابات مقنعة لخداع أصدقائك وجعلهم يصوتون لها. 
            تجمع اللعبة بين المتعة والتحدي وهي مثالية للتجمعات العائلية وسهرات الأصدقاء.
          </p>
        </section>

        {/* طريقة اللعب - مهمة عشان جوجل يحب الخطوات */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>شرح طريقة اللعب</h2>
          <ul style={{ listStyleType: 'decimal', paddingRight: '20px' }}>
            <li><strong>اجمع أصحابك:</strong> قم بإنشاء غرفة وأرسل الكود لأصدقائك للانضمام.</li>
            <li><strong>ألف إجابة خادعة:</strong> سيظهر سؤال غريب، اكتب إجابة تبدو حقيقية ومقنعة.</li>
            <li><strong>اكتشف الحقيقة:</strong> ستظهر جميع الإجابات (بما فيها الصحيحة وتأليفات أصدقائك)، حاول اختيار الإجابة الصحيحة.</li>
            <li><strong>اجمع النقاط:</strong> تحصل على نقاط عند اختيار الإجابة الصحيحة، ونقاط إضافية عندما يختار أحد أصدقائك كذبتك!</li>
          </ul>
        </section>

        {/* مميزات اللعبة */}
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>مميزات اللعبة</h2>
          <ul style={{ listStyleType: 'disc', paddingRight: '20px' }}>
            <li>لعب مشترك عبر المتصفح (لا تحتاج تحميل تطبيقات).</li>
            <li>تدعم اللغة العربية بالكامل.</li>
            <li>نظام دردشة وتفاعل مباشر.</li>
            <li>أسئلة متنوعة في التاريخ، العلوم، والغرائب.</li>
          </ul>
        </section>

        {/* الأسئلة الشائعة FAQ - ممتازة للـ Rich Snippets */}
        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>الأسئلة الشائعة (FAQ)</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>هل اللعبة مجانية؟</h3>
            <p>نعم، لعبة دبيسهم مجانية بالكامل ويمكن لعبها من أي متصفح.</p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>كم عدد اللاعبين المسموح به؟</h3>
            <p>يمكنك اللعب مع عدد غير محدود من الأصدقاء، ولكن يُفضل أن يكون العدد بين 3 إلى 8 لاعبين لأفضل تجربة.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>كيف أفوز في اللعبة؟</h3>
            <p>الفائز هو من يجمع أكبر عدد من النقاط عبر معرفة الحقائق وخداع الآخرين بإجاباته المبتكرة.</p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SeoSection;