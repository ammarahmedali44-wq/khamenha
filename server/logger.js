// server/logger.js
const fs = require('fs');
const path = require('path');

// إنشاء Stream للكتابة (Append Mode)
const logStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });

const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}]: ${message}\n`;
  
  // الكتابة في الملف (Stream)
  logStream.write(logMessage);
  
  // الطباعة في الكونصول أيضاً للتطوير
  console.log(logMessage.trim());
};

module.exports = { log };