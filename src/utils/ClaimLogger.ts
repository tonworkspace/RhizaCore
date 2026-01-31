/**
 * ClaimLogger - Comprehensive logging and monitoring for RZC claiming operations
 * 
 * This utility provides structured logging, performance monitoring, and error tracking
 * for all claim-related operations. It helps with debugging, monitoring, and maintaining
 * system health.
 */

import {  ComprehensiveBalance } from '../types/ClaimTypes';

// ==========================================
// INTERFACES
// ==========================================

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  userId?: number;
  operation?: string;
  message: string;
  data?: any;
  duration?: number;
  error?: any;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum LogCategory {
  BALANCE_CALCULATION = 'balance_calculation',
  CLAIM_PROCESSING = 'claim_processing',
  VALIDATION = 'validation',
  SECURITY = 'security',
  DATABASE = 'database',
  PERFORMANCE = 'performance',
  ERROR_HANDLING = 'error_handling'
}

// ==========================================
// CLAIM LOGGER CLASS
// ==========================================

export class ClaimLogger {
  private static instance: ClaimLogger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Keep last 1000 log entries in memory

  private constructor() {}

  public static getInstance(): ClaimLogger {
    if (!ClaimLogger.instance) {
      ClaimLogger.instance = new ClaimLogger();
    }
    return ClaimLogger.instance;
  }

  // ==========================================
  // PUBLIC LOGGING METHODS
  // ==========================================

  /**
   * Log balance calculation operations
   */
  public logBalanceCalculation(
    userId: number,
    operation: string,
    balance: ComprehensiveBalance,
    duration?: number,
    error?: any
  ): void {
    this.log({
      level: error ? LogLevel.ERROR : LogLevel.INFO,
      category: LogCategory.BALANCE_CALCULATION,
      userId,
      operation,
      message: error 
        ? `Balance calculation failed: ${operation}` 
        : `Balance calculation completed: ${operation}`,
      data: {
        balance,
        calculatedAt: balance.calculatedAt,
        claimableRZC: balance.claimableRZC,
        availableBalance: balance.availableBalance,
        accumulatedRZC: balance.accumulatedRZC
      },
      duration,
      error
    });
  }

  /**
   * Log claim processing operations
   */
  public logClaimProcessing(
    userId: number,
    operation: string,
    amount: number,
    success: boolean,
    transactionId?: string,
    duration?: number,
    error?: any,
    metadata?: any
  ): void {
    this.log({
      level: success ? LogLevel.INFO : LogLevel.ERROR,
      category: LogCategory.CLAIM_PROCESSING,
      userId,
      operation,
      message: success 
        ? `Claim processed successfully: ${amount} RZC` 
        : `Claim processing failed: ${amount} RZC`,
      data: {
        amount,
        transactionId,
        metadata,
        success
      },
      duration,
      error
    });
  }

  /**
   * Log validation operations
   */
  public logValidation(
    userId: number,
    operation: string,
    isValid: boolean,
    details?: any,
    error?: any
  ): void {
    this.log({
      level: isValid ? LogLevel.INFO : LogLevel.WARN,
      category: LogCategory.VALIDATION,
      userId,
      operation,
      message: isValid 
        ? `Validation passed: ${operation}` 
        : `Validation failed: ${operation}`,
      data: {
        isValid,
        details
      },
      error
    });
  }

  /**
   * Log security operations
   */
  public logSecurity(
    userId: number,
    operation: string,
    level: LogLevel,
    message: string,
    data?: any
  ): void {
    this.log({
      level,
      category: LogCategory.SECURITY,
      userId,
      operation,
      message: `Security: ${message}`,
      data
    });
  }

  /**
   * Log database operations
   */
  public logDatabase(
    operation: string,
    success: boolean,
    duration?: number,
    error?: any,
    data?: any
  ): void {
    this.log({
      level: success ? LogLevel.DEBUG : LogLevel.ERROR,
      category: LogCategory.DATABASE,
      operation,
      message: success 
        ? `Database operation completed: ${operation}` 
        : `Database operation failed: ${operation}`,
      data,
      duration,
      error
    });
  }

  /**
   * Log performance metrics
   */
  public logPerformance(
    operation: string,
    duration: number,
    userId?: number,
    data?: any
  ): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG; // Warn if operation takes > 5 seconds
    
    this.log({
      level,
      category: LogCategory.PERFORMANCE,
      userId,
      operation,
      message: `Performance: ${operation} took ${duration}ms`,
      data: {
        ...data,
        performanceThreshold: duration > 5000 ? 'SLOW' : 'NORMAL'
      },
      duration
    });
  }

  /**
   * Log errors with context
   */
  public logError(
    error: any,
    context: {
      userId?: number;
      operation?: string;
      category?: LogCategory;
      data?: any;
    }
  ): void {
    this.log({
      level: LogLevel.ERROR,
      category: context.category || LogCategory.ERROR_HANDLING,
      userId: context.userId,
      operation: context.operation,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: context.data,
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      }
    });
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Create a performance timer
   */
  public startTimer(): () => number {
    const startTime = Date.now();
    return () => Date.now() - startTime;
  }

  /**
   * Log operation with automatic timing
   */
  public async logOperation<T>(
    operation: string,
    category: LogCategory,
    userId: number | undefined,
    fn: () => Promise<T>
  ): Promise<T> {
    const timer = this.startTimer();
    const startMessage = `Starting ${operation}`;
    
    this.log({
      level: LogLevel.DEBUG,
      category,
      userId,
      operation,
      message: startMessage
    });

    try {
      const result = await fn();
      const duration = timer();
      
      this.log({
        level: LogLevel.INFO,
        category,
        userId,
        operation,
        message: `Completed ${operation}`,
        duration
      });

      this.logPerformance(operation, duration, userId);
      
      return result;
    } catch (error) {
      const duration = timer();
      
      this.logError(error, {
        userId,
        operation,
        category,
        data: { duration }
      });
      
      throw error;
    }
  }

  /**
   * Get recent logs with filtering
   */
  public getLogs(filter?: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: number;
    operation?: string;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      if (filter.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filter.category);
      }
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
      }
      if (filter.operation) {
        filteredLogs = filteredLogs.filter(log => log.operation === filter.operation);
      }
    }

    const limit = filter?.limit || 100;
    return filteredLogs.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(operation?: string): {
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    totalOperations: number;
    slowOperations: number;
  } {
    const performanceLogs = this.logs.filter(log => 
      log.category === LogCategory.PERFORMANCE &&
      log.duration !== undefined &&
      (!operation || log.operation === operation)
    );

    if (performanceLogs.length === 0) {
      return {
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        totalOperations: 0,
        slowOperations: 0
      };
    }

    const durations = performanceLogs.map(log => log.duration!);
    const slowOperations = performanceLogs.filter(log => log.duration! > 5000).length;

    return {
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      totalOperations: performanceLogs.length,
      slowOperations
    };
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsByOperation: Record<string, number>;
    recentErrors: LogEntry[];
  } {
    const errorLogs = this.logs.filter(log => log.level === LogLevel.ERROR);
    
    const errorsByCategory: Record<string, number> = {};
    const errorsByOperation: Record<string, number> = {};

    errorLogs.forEach(log => {
      errorsByCategory[log.category] = (errorsByCategory[log.category] || 0) + 1;
      if (log.operation) {
        errorsByOperation[log.operation] = (errorsByOperation[log.operation] || 0) + 1;
      }
    });

    return {
      totalErrors: errorLogs.length,
      errorsByCategory,
      errorsByOperation,
      recentErrors: errorLogs.slice(-10).reverse() // Last 10 errors
    };
  }

  /**
   * Clear old logs to prevent memory issues
   */
  public clearOldLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Export logs for external analysis
   */
  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'level', 'category', 'userId', 'operation', 'message', 'duration'];
      const csvRows = [headers.join(',')];
      
      this.logs.forEach(log => {
        const row = [
          log.timestamp,
          log.level,
          log.category,
          log.userId || '',
          log.operation || '',
          `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
          log.duration || ''
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  /**
   * Core logging method
   */
  private log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    this.logs.push(logEntry);

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = this.getConsoleMethod(entry.level);
      const prefix = `[${entry.category.toUpperCase()}]${entry.userId ? ` User:${entry.userId}` : ''}${entry.operation ? ` Op:${entry.operation}` : ''}`;
      
      consoleMethod(`${prefix} ${entry.message}`, entry.data || '');
      
      if (entry.error) {
        console.error('Error details:', entry.error);
      }
    }

    // Clean up old logs periodically
    if (this.logs.length % 100 === 0) {
      this.clearOldLogs();
    }
  }

  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.DEBUG:
      default:
        return console.log;
    }
  }
}

// Export singleton instance
export default ClaimLogger;