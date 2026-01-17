import util from 'node:util';

const formatMessage = (level, args) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${util.format(...args)}`;
};

const writeLine = (stream, message) => {
  stream.write(`${message}\n`);
};

export const serverLogger = {
  info: (...args) => writeLine(process.stdout, formatMessage('INFO', args)),
  warn: (...args) => writeLine(process.stdout, formatMessage('WARN', args)),
  error: (...args) => writeLine(process.stderr, formatMessage('ERROR', args)),
  debug: (...args) => writeLine(process.stdout, formatMessage('DEBUG', args)),
};
