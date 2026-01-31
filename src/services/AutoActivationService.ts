import { supabase } from '../lib/supabaseClient';

export interface AutoActivationResult {
  success: boolean;
  user_id?: number;
  username?: string;
  activation_id?: number;
  rzc_awarded?: number;
  message?: string;
  error?: string;
}

export interface BulkActivationResult {
  total_processed: number;
  success_count: number;
  error_count: number;
  results: AutoActivationResult[];
}

export interface ActivationStats {
  total_users: number;
  activated_users: number;
  pending_users: number;
  activation_rate: number;
  today_activations: number;
  auto_activations: number;
}

export class AutoActivationService {
  
  /**
   * Auto-activate a single user by ID
   */
  static async activateUserById(
    userId: number, 
    reason: string = 'Auto-activation',
    rzcAmount: number = 150.0
  ): Promise<AutoActivationResult> {
    try {
      const { data, error } = await supabase.rpc('auto_activate_user', {
        p_user_id: userId,
        p_reason: reason,
        p_rzc_amount: rzcAmount
      });

      if (error) {
        console.error('Auto activation error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Auto activation service error:', error);
      return { success: false, error: error.message || 'Failed to activate user' };
    }
  }

  /**
   * Auto-activate a user by username
   */
  static async activateUserByUsername(
    username: string,
    reason: string = 'Auto-activation by username',
    rzcAmount: number = 150.0
  ): Promise<AutoActivationResult> {
    try {
      const { data, error } = await supabase.rpc('auto_activate_user_by_username', {
        p_username: username,
        p_reason: reason,
        p_rzc_amount: rzcAmount
      });

      if (error) {
        console.error('Auto activation by username error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Auto activation by username service error:', error);
      return { success: false, error: error.message || 'Failed to activate user' };
    }
  }

  /**
   * Auto-activate a user by Telegram ID
   */
  static async activateUserByTelegramId(
    telegramId: number,
    reason: string = 'Auto-activation by Telegram ID',
    rzcAmount: number = 150.0
  ): Promise<AutoActivationResult> {
    try {
      const { data, error } = await supabase.rpc('auto_activate_user_by_telegram', {
        p_telegram_id: telegramId,
        p_reason: reason,
        p_rzc_amount: rzcAmount
      });

      if (error) {
        console.error('Auto activation by telegram error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Auto activation by telegram service error:', error);
      return { success: false, error: error.message || 'Failed to activate user' };
    }
  }

  /**
   * Bulk activate multiple users by their IDs
   */
  static async bulkActivateUsers(
    userIds: number[],
    reason: string = 'Bulk auto-activation',
    rzcAmount: number = 150.0
  ): Promise<BulkActivationResult> {
    try {
      const { data, error } = await supabase.rpc('bulk_auto_activate_users', {
        p_user_ids: userIds,
        p_reason: reason,
        p_rzc_amount: rzcAmount
      });

      if (error) {
        console.error('Bulk activation error:', error);
        return { 
          total_processed: 0, 
          success_count: 0, 
          error_count: userIds.length, 
          results: [{ success: false, error: error.message }] 
        };
      }

      return data;
    } catch (error: any) {
      console.error('Bulk activation service error:', error);
      return { 
        total_processed: 0, 
        success_count: 0, 
        error_count: userIds.length, 
        results: [{ success: false, error: error.message || 'Failed to bulk activate users' }] 
      };
    }
  }

  /**
   * Auto-activate users based on criteria
   */
  static async activateUsersByCriteria(
    criteria: {
      createdAfter?: Date;
      createdBefore?: Date;
      usernamePattern?: string;
      reason?: string;
      rzcAmount?: number;
      limit?: number;
    }
  ): Promise<BulkActivationResult> {
    try {
      const { data, error } = await supabase.rpc('auto_activate_users_by_criteria', {
        p_created_after: criteria.createdAfter?.toISOString() || null,
        p_created_before: criteria.createdBefore?.toISOString() || null,
        p_username_pattern: criteria.usernamePattern || null,
        p_reason: criteria.reason || 'Conditional auto-activation',
        p_rzc_amount: criteria.rzcAmount || 150.0,
        p_limit: criteria.limit || 100
      });

      if (error) {
        console.error('Criteria activation error:', error);
        return { 
          total_processed: 0, 
          success_count: 0, 
          error_count: 1, 
          results: [{ success: false, error: error.message }] 
        };
      }

      return data;
    } catch (error: any) {
      console.error('Criteria activation service error:', error);
      return { 
        total_processed: 0, 
        success_count: 0, 
        error_count: 1, 
        results: [{ success: false, error: error.message || 'Failed to activate users by criteria' }] 
      };
    }
  }

  /**
   * Get activation statistics
   */
  static async getActivationStats(): Promise<ActivationStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_activation_stats');

      if (error) {
        console.error('Get activation stats error:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Get activation stats service error:', error);
      return null;
    }
  }

  /**
   * Preview users that would be activated by criteria (for safety)
   */
  static async previewActivationCandidates(
    criteria: {
      createdAfter?: Date;
      createdBefore?: Date;
      usernamePattern?: string;
      limit?: number;
    }
  ): Promise<Array<{
    user_id: number;
    username: string;
    display_name: string;
    telegram_id: number;
    created_at: string;
  }> | null> {
    try {
      const { data, error } = await supabase.rpc('preview_activation_candidates', {
        p_created_after: criteria.createdAfter?.toISOString() || null,
        p_created_before: criteria.createdBefore?.toISOString() || null,
        p_username_pattern: criteria.usernamePattern || null,
        p_limit: criteria.limit || 100
      });

      if (error) {
        console.error('Preview activation candidates error:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Preview activation candidates service error:', error);
      return null;
    }
  }

  /**
   * DANGEROUS: Auto-activate ALL users (use with extreme caution)
   */
  static async activateAllUsers(
    reason: string = 'Mass auto-activation',
    rzcAmount: number = 150.0,
    limit: number = 1000
  ): Promise<BulkActivationResult> {
    try {
      // Add extra confirmation in the reason
      const confirmationReason = `${reason} - MASS ACTIVATION CONFIRMED`;
      
      const { data, error } = await supabase.rpc('auto_activate_all_users', {
        p_reason: confirmationReason,
        p_rzc_amount: rzcAmount,
        p_limit: limit
      });

      if (error) {
        console.error('Mass activation error:', error);
        return { 
          total_processed: 0, 
          success_count: 0, 
          error_count: 1, 
          results: [{ success: false, error: error.message }] 
        };
      }

      return data;
    } catch (error: any) {
      console.error('Mass activation service error:', error);
      return { 
        total_processed: 0, 
        success_count: 0, 
        error_count: 1, 
        results: [{ success: false, error: error.message || 'Failed to mass activate users' }] 
      };
    }
  }
}

// Convenience functions for common use cases
export const autoActivationHelpers = {
  
  /**
   * Activate test users (users with 'test' in username)
   */
  async activateTestUsers(reason: string = 'Test environment setup'): Promise<BulkActivationResult> {
    return AutoActivationService.activateUsersByCriteria({
      usernamePattern: 'test',
      reason
    });
  },

  /**
   * Activate users created in the last 24 hours
   */
  async activateRecentUsers(reason: string = 'Recent user activation'): Promise<BulkActivationResult> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return AutoActivationService.activateUsersByCriteria({
      createdAfter: yesterday,
      reason
    });
  },

  /**
   * Activate users created today
   */
  async activateTodayUsers(reason: string = 'Daily activation batch'): Promise<BulkActivationResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return AutoActivationService.activateUsersByCriteria({
      createdAfter: today,
      reason
    });
  },

  /**
   * Preview what users would be activated before doing it
   */
  async previewAndActivateTestUsers(): Promise<{
    preview: any[] | null;
    activation: BulkActivationResult | null;
  }> {
    // First preview
    const preview = await AutoActivationService.previewActivationCandidates({
      usernamePattern: 'test'
    });

    console.log('Preview of test users to activate:', preview);

    // Ask for confirmation (in a real app, you'd show this to the user)
    if (preview && preview.length > 0) {
      const activation = await AutoActivationService.activateUsersByCriteria({
        usernamePattern: 'test',
        reason: 'Test user activation after preview'
      });
      
      return { preview, activation };
    }

    return { preview, activation: null };
  }
};