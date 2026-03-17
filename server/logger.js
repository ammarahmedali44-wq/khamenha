// server/logger.js

const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}]: ${message}`;
  console.log(logMessage);
};

module.exports = { log };
