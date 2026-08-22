import crypto from 'crypto';
import prisma from '../config/db.js';

/**
 * 21 CFR Part 11 & ISO 17025 Compliant Audit Service
 * Maintains tamper-evident audit logs using SHA-256 hash chaining.
 */
export class AuditService {
  /**
   * Computes cryptographic checksum of log entry linked to previous hash
   */
  static generateHash(previousHash, payload) {
    const dataString = `${previousHash || 'GENESIS'}|${payload.timestamp}|${payload.userId}|${payload.action}|${payload.entityName}|${payload.entityId}|${payload.previousValues}|${payload.newValues}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Log an audit event into the database with 21 CFR Part 11 integrity
   */
  static async logEvent({ userId, userName, userRole, action, entityName, entityId, previousValues = null, newValues = null, reasonForChange = null, ipAddress = '127.0.0.1' }) {
    try {
      // Get latest audit record to chain hash
      const lastAudit = await prisma.auditTrail.findFirst({
        orderBy: { id: 'desc' }
      });
      const previousHash = lastAudit ? lastAudit.hashChecksum : '0000000000000000000000000000000000000000000000000000000000000000';

      const timestamp = new Date().toISOString();
      const prevStr = previousValues ? JSON.stringify(previousValues) : '';
      const newStr = newValues ? JSON.stringify(newValues) : '';

      const hashChecksum = this.generateHash(previousHash, {
        timestamp,
        userId: userId || 'SYSTEM',
        action,
        entityName,
        entityId: String(entityId),
        previousValues: prevStr,
        newValues: newStr
      });

      const auditRecord = await prisma.auditTrail.create({
        data: {
          timestamp: new Date(timestamp),
          userId: userId ? Number(userId) : null,
          userName: userName || 'Sistema Autónomo',
          userRole: userRole || 'SYSTEM',
          action,
          entityName,
          entityId: String(entityId),
          previousValues: prevStr,
          newValues: newStr,
          reasonForChange,
          ipAddress,
          hashChecksum
        }
      });

      return auditRecord;
    } catch (error) {
      console.error('💥 Error crítico en AuditService logEvent:', error.message);
      // In 21 CFR Part 11 compliant environments, audit logging failures must be alerted
      throw new Error(`Fallo en registro de auditoría obligatoria: ${error.message}`);
    }
  }

  /**
   * Verifies the integrity of the entire audit chain
   */
  static async verifyAuditChainIntegrity() {
    const logs = await prisma.auditTrail.findMany({
      orderBy: { id: 'asc' }
    });

    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    let isCorrupted = false;
    const corruptedIds = [];

    for (const log of logs) {
      const expectedHash = this.generateHash(previousHash, {
        timestamp: log.timestamp.toISOString(),
        userId: log.userId || 'SYSTEM',
        action: log.action,
        entityName: log.entityName,
        entityId: log.entityId,
        previousValues: log.previousValues || '',
        newValues: log.newValues || ''
      });

      if (log.hashChecksum !== expectedHash) {
        isCorrupted = true;
        corruptedIds.push(log.id);
      }
      previousHash = log.hashChecksum;
    }

    return {
      totalRecords: logs.length,
      isValid: !isCorrupted,
      corruptedIds
    };
  }
}
