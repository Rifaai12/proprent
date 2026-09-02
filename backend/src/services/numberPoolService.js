import { db } from '../config/db.js';

/**
 * Smart Anti-Blocking Number Pool Manager (Owner-Scoped)
 * Prevents tenant phone spam filters (Truecaller, Google Phone, iOS Spam Blockers)
 * from blocking numbers by rotating through the owner's active caller ID pool.
 */
export class NumberPoolService {
  /**
   * Get all active caller IDs in the pool for a specific owner
   */
  static async getPool(ownerId) {
    return await db.getByOwner('phone_numbers', ownerId);
  }

  /**
   * Add a new phone number to the owner's rotating pool
   */
  static async addNumber(ownerId, { phone_number, label, provider }) {
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
    return await db.insertForOwner('phone_numbers', ownerId, newNumber);
  }

  /**
   * Toggle number active status or update for owner
   */
  static async updateNumber(ownerId, id, updates) {
    return await db.updateForOwner('phone_numbers', ownerId, id, updates);
  }

  /**
   * Delete number from owner pool
   */
  static async deleteNumber(ownerId, id) {
    return await db.deleteForOwner('phone_numbers', ownerId, id);
  }

  /**
   * Core Anti-Blocking Selection Algorithm (Scoped to Owner & Tenant):
   */
  static async selectRotatedCallerId(ownerId, tenantId) {
    const allNumbers = await db.getByOwner('phone_numbers', ownerId);
    const activeNumbers = allNumbers.filter(n => n.is_active);

    if (!activeNumbers || activeNumbers.length === 0) {
      // Fallback to owner's settings phone number
      const settings = await db.getSettingsForOwner(ownerId);
      return {
        phone_number: settings.owner_phone || '+91 80000 00000',
        label: 'Default Property Line',
        id: 'default'
      };
    }

    if (activeNumbers.length === 1) {
      return activeNumbers[0];
    }

    // Get previous call logs for this tenant to identify what numbers were recently used
    const allLogs = await db.getByOwner('automation_logs', ownerId);
    const recentTenantCalls = allLogs.filter(log => 
      log.tenant_id === tenantId && log.channel === 'ai_call'
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const lastUsedNumber = recentTenantCalls.length > 0 ? recentTenantCalls[0].caller_id_used : null;

    // Filter out the last used number to prevent sequential duplicate caller IDs
    let candidateNumbers = activeNumbers.filter(n => n.phone_number !== lastUsedNumber);

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
    await db.updateForOwner('phone_numbers', ownerId, chosenNumber.id, {
      calls_count: (chosenNumber.calls_count || 0) + 1,
      last_used_at: new Date().toISOString()
    });

    return chosenNumber;
  }
}
