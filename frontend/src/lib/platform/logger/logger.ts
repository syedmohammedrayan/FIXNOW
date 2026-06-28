/**
 * Base structured logger for the FixNow platform.
 * Emits JSON formatted logs for Datadog / CloudWatch.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  [key: string]: any;
}

export class Logger {
  private static emit(entry: LogEntry) {
    const output = JSON.stringify(entry);
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
        console.error(output);
        break;
    }
  }

  private static buildEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...context
    };
  }

  static debug(message: string, context?: Record<string, any>) {
    this.emit(this.buildEntry(LogLevel.DEBUG, message, context));
  }

  static info(message: string, context?: Record<string, any>) {
    this.emit(this.buildEntry(LogLevel.INFO, message, context));
  }

  static warn(message: string, context?: Record<string, any>) {
    this.emit(this.buildEntry(LogLevel.WARN, message, context));
  }

  static error(message: string, context?: Record<string, any>) {
    this.emit(this.buildEntry(LogLevel.ERROR, message, context));
  }
}
