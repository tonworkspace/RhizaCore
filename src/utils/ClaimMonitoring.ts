/**
 * ClaimMonitoring - Comprehensive monitoring and observability for RZC claiming system
 * 
 * This utility provides real-time monitoring, health checks, and alerting capabilities
 * for the claiming system. It tracks key metrics, performance indicators, and system health.
 */

import { ClaimLogger, LogLevel, LogCategory } from './ClaimLogger';
import { ClaimErrorType } from '../types/ClaimTypes';

// ==========================================
// INTERFACES
// ==========================================

export interface SystemMetrics {
  claimSuccessRate: number;
  averageClaimProcessingTime: number;
  totalClaimsProcessed: number;
  totalErrorsEncountered: number;
  balanceDiscrepancyRate: number;
  activeUsers: number;
  systemHealth: HealthStatus;
  lastUpdated: Date;
}

export interface HealthCheck {
  component: string;
  status: HealthStatus;
  message: string;
  lastChecked: Date;
  responseTime?: number;
  details?: any;
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: any;
}

export enum AlertType {
  HIGH_ERROR_RATE = 'high_error_rate',
  SLOW_PERFORMANCE = 'slow_performance',
  BALANCE_DISCREPANCY = 'balance_discrepancy',
  SYSTEM_FAILURE = 'system_failure',
  SECURITY_ISSUE = 'security_issue'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ==========================================
// CLAIM MONITORING CLASS
// ==========================================

export class ClaimMonitoring {
  private static instance: ClaimMonitoring;
  private logger: ClaimLogger;
  private metrics: SystemMetrics;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Alert[] = [];
  private monitoringInterval?: NodeJS.Timeout;

  // Thresholds for alerting
  private readonly THRESHOLDS = {
    ERROR_RATE: 0.05, // 5% error rate threshold
    SLOW_OPERATION: 5000, // 5 seconds
    BALANCE_DISCREPANCY: 0.01, // 1% discrepancy threshold
    MAX_ALERTS: 100 // Maximum alerts to keep in memory
  };

  private constructor() {
    this.logger = ClaimLogger.getInstance();
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  public static getInstance(): ClaimMonitoring {
    if (!ClaimMonitoring.instance) {
      ClaimMonitoring.instance = new ClaimMonitoring();
    }
    return ClaimMonitoring.instance;
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Get current system metrics
   */
  public getSystemMetrics(): SystemMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): {
    overallStatus: HealthStatus;
    components: HealthCheck[];
    summary: string;
  } {
    const components = Array.from(this.healthChecks.values());
    const overallStatus = this.calculateOverallHealth(components);
    
    const healthyCount = components.filter(c => c.status === HealthStatus.HEALTHY).length;
    const warningCount = components.filter(c => c.status === HealthStatus.WARNING).length;
    const criticalCount = components.filter(c => c.status === HealthStatus.CRITICAL).length;
    
    const summary = `${healthyCount} healthy, ${warningCount} warnings, ${criticalCount} critical`;

    return {
      overallStatus,
      components,
      summary
    };
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts with filtering
   */
  public getAlerts(filter?: {
    type?: AlertType;
    severity?: AlertSeverity;
    resolved?: boolean;
    limit?: number;
  }): Alert[] {
    let filteredAlerts = [...this.alerts];

    if (filter) {
      if (filter.type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === filter.type);
      }
      if (filter.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === filter.severity);
      }
      if (filter.resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.resolved === filter.resolved);
      }
    }

    const limit = filter?.limit || 50;
    return filteredAlerts.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Record a successful claim operation
   */
  public recordClaimSuccess(userId: number, amount: number, processingTime: number): void {
    this.logger.logClaimProcessing(
      userId,
      'claim_success',
      amount,
      true,
      undefined,
      processingTime
    );

    // Check for performance issues
    if (processingTime > this.THRESHOLDS.SLOW_OPERATION) {
      this.createAlert(
        AlertType.SLOW_PERFORMANCE,
        AlertSeverity.MEDIUM,
        `Slow claim processing: ${processingTime}ms for user ${userId}`,
        { userId, amount, processingTime }
      );
    }
  }

  /**
   * Record a failed claim operation
   */
  public recordClaimFailure(
    userId: number,
    amount: number,
    error: any,
    errorType: ClaimErrorType,
    processingTime?: number
  ): void {
    this.logger.logClaimProcessing(
      userId,
      'claim_failure',
      amount,
      false,
      undefined,
      processingTime,
      error
    );

    // Create alert for critical errors
    if (errorType === ClaimErrorType.DATABASE_ERROR || errorType === ClaimErrorType.TRANSACTION_ERROR) {
      this.createAlert(
        AlertType.SYSTEM_FAILURE,
        AlertSeverity.HIGH,
        `Critical claim failure: ${errorType} for user ${userId}`,
        { userId, amount, errorType, error: error?.message }
      );
    }
  }

  /**
   * Record balance discrepancy
   */
  public recordBalanceDiscrepancy(
    userId: number,
    calculatedBalance: number,
    databaseBalance: number,
    discrepancy: number
  ): void {
    this.logger.logBalanceCalculation(
      userId,
      'balance_discrepancy',
      {
        availableBalance: databaseBalance,
        claimableRZC: calculatedBalance,
        accumulatedRZC: 0,
        totalEarned: 0,
        calculatedAt: new Date()
      }
    );

    const discrepancyPercentage = Math.abs(discrepancy) / Math.max(calculatedBalance, databaseBalance);
    
    if (discrepancyPercentage > this.THRESHOLDS.BALANCE_DISCREPANCY) {
      this.createAlert(
        AlertType.BALANCE_DISCREPANCY,
        AlertSeverity.MEDIUM,
        `Significant balance discrepancy for user ${userId}: ${discrepancy} RZC`,
        { userId, calculatedBalance, databaseBalance, discrepancy, discrepancyPercentage }
      );
    }
  }

  /**
   * Perform health check on a system component
   */
  public async performHealthCheck(
    component: string,
    checkFunction: () => Promise<{ status: HealthStatus; message: string; details?: any }>
  ): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const result = await checkFunction();
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        component,
        status: result.status,
        message: result.message,
        lastChecked: new Date(),
        responseTime,
        details: result.details
      };

      this.healthChecks.set(component, healthCheck);
      
      this.logger.logPerformance(component, responseTime);
      
      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        component,
        status: HealthStatus.CRITICAL,
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        responseTime,
        details: { error }
      };

      this.healthChecks.set(component, healthCheck);
      
      this.logger.logError(error, {
        operation: 'health_check',
        category: LogCategory.PERFORMANCE,
        data: { component, responseTime }
      });

      return healthCheck;
    }
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      this.logger.logSecurity(
        0,
        'alert_resolved',
        LogLevel.INFO,
        `Alert resolved: ${alert.type}`,
        { alertId, type: alert.type, severity: alert.severity }
      );
      
      return true;
    }
    return false;
  }

  /**
   * Get monitoring dashboard data
   */
  public getDashboardData(): {
    metrics: SystemMetrics;
    health: ReturnType<ClaimMonitoring['getSystemHealth']>;
    activeAlerts: Alert[];
    recentActivity: any[];
    performanceStats: any;
  } {
    const performanceStats = this.logger.getPerformanceStats();
    const errorStats = this.logger.getErrorStats();
    const recentLogs = this.logger.getLogs({ limit: 20 });

    return {
      metrics: this.getSystemMetrics(),
      health: this.getSystemHealth(),
      activeAlerts: this.getActiveAlerts(),
      recentActivity: recentLogs,
      performanceStats: {
        ...performanceStats,
        errorStats
      }
    };
  }

  /**
   * Start continuous monitoring
   */
  public startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkAlertThresholds();
      this.cleanupOldAlerts();
    }, 60000); // Update every minute

    this.logger.logPerformance('monitoring_started', 0);
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.logger.logPerformance('monitoring_stopped', 0);
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): SystemMetrics {
    return {
      claimSuccessRate: 0,
      averageClaimProcessingTime: 0,
      totalClaimsProcessed: 0,
      totalErrorsEncountered: 0,
      balanceDiscrepancyRate: 0,
      activeUsers: 0,
      systemHealth: HealthStatus.UNKNOWN,
      lastUpdated: new Date()
    };
  }

  /**
   * Update system metrics based on recent logs
   */
  private updateMetrics(): void {
    const performanceStats = this.logger.getPerformanceStats('claim_processing');
    const errorStats = this.logger.getErrorStats();
    const recentLogs = this.logger.getLogs({ 
      category: LogCategory.CLAIM_PROCESSING,
      limit: 1000 
    });

    const claimLogs = recentLogs.filter(log => 
      log.operation === 'claim_success' || log.operation === 'claim_failure'
    );

    const successfulClaims = claimLogs.filter(log => log.operation === 'claim_success').length;
    const totalClaims = claimLogs.length;

    this.metrics = {
      claimSuccessRate: totalClaims > 0 ? successfulClaims / totalClaims : 0,
      averageClaimProcessingTime: performanceStats.averageDuration,
      totalClaimsProcessed: totalClaims,
      totalErrorsEncountered: errorStats.totalErrors,
      balanceDiscrepancyRate: this.calculateBalanceDiscrepancyRate(),
      activeUsers: this.calculateActiveUsers(),
      systemHealth: this.calculateOverallHealth(Array.from(this.healthChecks.values())),
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate balance discrepancy rate
   */
  private calculateBalanceDiscrepancyRate(): number {
    const balanceLogs = this.logger.getLogs({
      category: LogCategory.BALANCE_CALCULATION,
      limit: 1000
    });

    const discrepancyLogs = balanceLogs.filter(log => 
      log.operation === 'balance_discrepancy'
    );

    return balanceLogs.length > 0 ? discrepancyLogs.length / balanceLogs.length : 0;
  }

  /**
   * Calculate number of active users
   */
  private calculateActiveUsers(): number {
    const recentLogs = this.logger.getLogs({ limit: 1000 });
    const uniqueUsers = new Set(
      recentLogs
        .filter(log => log.userId)
        .map(log => log.userId)
    );
    return uniqueUsers.size;
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(components: HealthCheck[]): HealthStatus {
    if (components.length === 0) return HealthStatus.UNKNOWN;

    const hasCritical = components.some(c => c.status === HealthStatus.CRITICAL);
    const hasWarning = components.some(c => c.status === HealthStatus.WARNING);

    if (hasCritical) return HealthStatus.CRITICAL;
    if (hasWarning) return HealthStatus.WARNING;
    return HealthStatus.HEALTHY;
  }

  /**
   * Check alert thresholds and create alerts if needed
   */
  private checkAlertThresholds(): void {
    // Check error rate
    if (this.metrics.claimSuccessRate < (1 - this.THRESHOLDS.ERROR_RATE)) {
      this.createAlert(
        AlertType.HIGH_ERROR_RATE,
        AlertSeverity.HIGH,
        `High error rate detected: ${((1 - this.metrics.claimSuccessRate) * 100).toFixed(2)}%`,
        { errorRate: 1 - this.metrics.claimSuccessRate, threshold: this.THRESHOLDS.ERROR_RATE }
      );
    }

    // Check performance
    if (this.metrics.averageClaimProcessingTime > this.THRESHOLDS.SLOW_OPERATION) {
      this.createAlert(
        AlertType.SLOW_PERFORMANCE,
        AlertSeverity.MEDIUM,
        `Slow average processing time: ${this.metrics.averageClaimProcessingTime}ms`,
        { averageTime: this.metrics.averageClaimProcessingTime, threshold: this.THRESHOLDS.SLOW_OPERATION }
      );
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(
    type: AlertType,
    severity: AlertSeverity,
    message: string,
    metadata?: any
  ): void {
    // Check if similar alert already exists and is not resolved
    const existingAlert = this.alerts.find(alert => 
      alert.type === type && 
      !alert.resolved && 
      Date.now() - alert.timestamp.getTime() < 300000 // Within last 5 minutes
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };

    this.alerts.push(alert);

    this.logger.logSecurity(
      0,
      'alert_created',
      severity === AlertSeverity.CRITICAL ? LogLevel.ERROR : LogLevel.WARN,
      `Alert created: ${type} - ${message}`,
      { alertId: alert.id, type, severity, metadata }
    );

    // Auto-resolve low severity alerts after some time
    if (severity === AlertSeverity.LOW) {
      setTimeout(() => {
        this.resolveAlert(alert.id);
      }, 600000); // Auto-resolve after 10 minutes
    }
  }

  /**
   * Clean up old alerts to prevent memory issues
   */
  private cleanupOldAlerts(): void {
    if (this.alerts.length > this.THRESHOLDS.MAX_ALERTS) {
      // Keep only the most recent alerts
      this.alerts = this.alerts
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.THRESHOLDS.MAX_ALERTS);
    }

    // Remove resolved alerts older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || alert.timestamp > oneDayAgo
    );
  }
}

// Export singleton instance
export default ClaimMonitoring;