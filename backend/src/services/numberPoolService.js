import { db } from '../config/db.js';

/**
 * Smart Anti-Blocking Number Pool Manager
 * Prevents tenant phone spam filters (Truecaller, Google Phone, iOS Spam Blockers)
 * from blocking numbers by rotating through an active caller ID pool.
 */
export class NumberPoolService {
  /**
   * Get all active caller IDs in the pool
   */
  static getPool() {
    return db.get('phone_numbers');
  }

  /**
   * Add a new phone number to the rotating pool
   */
  static addNumber({ phone_number, label, provider }) {
    const newNumber = {
      id: `num-${Date.now()}`,
      phone_number,
      label: label || `Caller Line ${Date.now().toString().slice(-4)}`,
      provider: provider || 'Twilio / Cloud DID',
      is_active: true,
      calls_count: 0,
      last_used_at: null,
      reputation: 'Clean (100% Delivery)'
    };
    return db.insert('phone_numbers', newNumber);
  }

  /**
   * Toggle number active status or delete
   */
  static updateNumber(id, updates) {
    return db.update('phone_numbers', id, updates);
  }

  static deleteNumber(id) {
    return db.delete('phone_numbers', id);
  }

  /**
   * Core Anti-Blocking Selection Algorithm:
   * 1. Finds all active numbers.
   * 2. Inspects recent call logs for the given tenant.
   * 3. Excludes the phone number used in the most recent 1-2 calls to this tenant.
   * 4. Among remaining candidates, picks the one with the lowest total calls or oldest last_used_at (least-recently-used).
   */
  static selectRotatedCallerId(tenantId) {
    const activeNumbers = db.filter('phone_numbers', n => n.is_active);

    if (!activeNumbers || activeNumbers.length === 0) {
      // Fallback to default owner or system number
      const settings = db.getSettings();
      return {
        phone_number: settings.owner_phone || '+91 80000 00000',
        label: 'Default Emergency Line',
        id: 'default'
      };
    }

    if (activeNumbers.length === 1) {
      return activeNumbers[0];
    }

    // Get previous call logs for this tenant to identify what numbers were recently used
    const recentTenantCalls = db.filter('automation_logs', log => 
      log.tenant_id === tenantId && log.channel === 'ai_call'
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const lastUsedNumber = recentTenantCalls.length > 0 ? recentTenantCalls[0].caller_id_used : null;

    // Filter out the last used number to prevent sequential duplicate caller IDs
    let candidateNumbers = activeNumbers.filter(n => n.phone_number !== lastUsedNumber);

    // If all numbers were excluded (e.g. pool of 1), fallback to all active
    if (candidateNumbers.length === 0) {
      candidateNumbers = activeNumbers;
    }

    // Sort candidate numbers by calls_count ascending, then by last_used_at ascending (LRU)
    candidateNumbers.sort((a, b) => {
      if (a.calls_count !== b.calls_count) {
        return a.calls_count - b.calls_count;
      }
      const timeA = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
      const timeB = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
      return timeA - timeB;
    });

    const chosenNumber = candidateNumbers[0];

    // Record usage metrics
    db.update('phone_numbers', chosenNumber.id, {
      calls_count: (chosenNumber.calls_count || 0) + 1,
      last_used_at: new Date().toISOString()
    });

    return chosenNumber;
  }
}
