# استخدام نسخة Node.js خفيفة (Alpine)
FROM node:18-alpine

# تحديد مسار العمل داخل الكونتينر
WORKDIR /app

# نسخ ملفات تعريف المكتبات أولاً (للاستفادة من الكاش)
COPY package*.json ./

# تثبيت المكتبات (Production Only لتسريع الحجم)
RUN npm install --only=production

# نسخ باقي ملفات الكود
COPY . .

# فتح البورت
EXPOSE 3001

# أمر التشغيل
CMD ["node", "index.js"]