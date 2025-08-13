import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

interface SecurityAlert {
  id: string;
  event: SecurityEvent;
  status: 'new' | 'investigating' | 'resolved';
  resolution?: string;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private alertThreshold: number = 5;
  private alertWindow: number = 5 * 60 * 1000; // 5 minutes
  private events: SecurityEvent[] = [];

  private constructor() {
    // Private constructor to enforce singleton
    this.startEventCleanup();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  private startEventCleanup(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.alertWindow;
      this.events = this.events.filter(event => 
        event.timestamp && event.timestamp.getTime() > cutoff
      );
    }, 60 * 1000); // Clean up every minute
  }

  private async logToFirestore(event: SecurityEvent): Promise<void> {
    try {
      const eventId = `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(firestore, 'security_events', eventId), {
        ...event,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log security event to Firestore:', error);
    }
  }

  private async logToAnalytics(event: SecurityEvent): Promise<void> {
    try {
      if (analytics) {
        logEvent(analytics, 'security_event', {
          event_type: event.type,
          severity: event.severity,
          user_id: event.userId || 'anonymous',
          ...event.metadata
        });
      }
    } catch (error) {
      console.error('Failed to log security event to Analytics:', error);
    }
  }

  private checkForAnomalies(event: SecurityEvent): void {
    const recentSimilarEvents = this.events.filter(e => 
      e.type === event.type &&
      e.userId === event.userId &&
      e.timestamp && 
      (Date.now() - e.timestamp.getTime()) < this.alertWindow
    );

    if (recentSimilarEvents.length >= this.alertThreshold) {
      this.createSecurityAlert({
        id: `alert_${Date.now()}`,
        event: event,
        status: 'new'
      });
    }
  }

  private async createSecurityAlert(alert: SecurityAlert): Promise<void> {
    try {
      // Log to Firestore
      await setDoc(doc(firestore, 'security_alerts', alert.id), {
        ...alert,
        timestamp: serverTimestamp()
      });

      // Send to monitoring service (implement in production)
      this.notifySecurityTeam(alert);
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }

  private notifySecurityTeam(alert: SecurityAlert): void {
    // In production, implement actual notification system
    console.warn('SECURITY ALERT:', {
      id: alert.id,
      type: alert.event.type,
      severity: alert.event.severity,
      description: alert.event.description,
      timestamp: new Date().toISOString()
    });
  }

  public async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Add timestamp if not provided
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || new Date()
    };

    // Add to local events array
    this.events.push(eventWithTimestamp);

    // Log to various destinations
    await Promise.all([
      this.logToFirestore(eventWithTimestamp),
      this.logToAnalytics(eventWithTimestamp)
    ]);

    // Check for potential security issues
    this.checkForAnomalies(eventWithTimestamp);
  }

  public async logFailedLogin(userId: string, reason: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'failed_login',
      severity: 'medium',
      description: `Failed login attempt: ${reason}`,
      userId,
      metadata: { reason }
    });
  }

  public async logSuspiciousActivity(
    type: string,
    description: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type: `suspicious_${type}`,
      severity: 'high',
      description,
      userId,
      metadata
    });
  }

  public async logSecurityViolation(
    type: string,
    description: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logSecurityEvent({
      type: `violation_${type}`,
      severity: 'critical',
      description,
      userId,
      metadata
    });
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance(); 