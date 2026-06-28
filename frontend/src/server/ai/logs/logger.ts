import pino from 'pino';

/**
 * Central AI Logger
 * Admin dashboard will read these logs later.
 */
export const aiLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});
