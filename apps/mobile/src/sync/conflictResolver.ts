// src/sync/conflictResolver.ts
import { LocalExpense } from '../db';

export interface ConflictResolutionResult {
  hasConflict: boolean;
  resolution: 'USE_SERVER' | 'USE_LOCAL' | 'FLAG_CONFLICT';
  resolvedRecord?: LocalExpense;
  reason?: string;
}

export class ConflictResolver {
  /**
   * Evaluates potential conflicts between a local expense and an incoming server update.
   */
  static evaluateExpenseConflict(
    local: LocalExpense | null,
    server: any,
  ): ConflictResolutionResult {
    if (!local) {
      return { hasConflict: false, resolution: 'USE_SERVER' };
    }

    // If local was already synced and matches server, no conflict
    if (local.syncStatus === 'SYNCED') {
      return { hasConflict: false, resolution: 'USE_SERVER' };
    }

    const localUpdated = new Date(local.updatedAt).getTime();
    const serverUpdated = new Date(
      server.updatedAt || server.createdAt,
    ).getTime();

    // If local is PENDING and server has a newer modification by another user
    if (local.syncStatus === 'PENDING' && serverUpdated > localUpdated) {
      // Check if amounts or splits differ
      const amountDiffers =
        local.amountMinor !== Math.round((server.amountLocal || 0) * 100);
      if (amountDiffers) {
        return {
          hasConflict: true,
          resolution: 'FLAG_CONFLICT',
          reason:
            'Both local device and server modified this expense with different amounts.',
        };
      }
    }

    return { hasConflict: false, resolution: 'USE_SERVER' };
  }
}
