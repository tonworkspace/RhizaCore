import { supabase } from '../lib/supabaseClient';

export interface AdminUser {
  id: number; // Integer ID for custom users table
  username?: string;
  telegram_id?: number;
  is_admin: boolean;
  admin_level: 'super' | 'admin' | 'moderator';
  created_at: string;
}

export interface AdminAuthResult {
  isAdmin: boolean;
  adminLevel?: 'super' | 'admin' | 'moderator';
  permissions?: string[];
}

export class AdminAuthService {
  
  /**
   * Check if a user is an admin (Integer ID version)
   */
  static async checkAdminStatus(userId: number): Promise<AdminAuthResult> {
    try {
      // First check environment variables for super admin
      const superAdminIds = this.getSuperAdminIds();
      const superAdminTelegramIds = this.getSuperAdminTelegramIds();
      
      if (superAdminIds.includes(userId.toString())) {
        return {
          isAdmin: true,
          adminLevel: 'super',
          permissions: ['all']
        };
      }

      // Check by Telegram ID if available
      if (superAdminTelegramIds.length > 0) {
        const { data: userData } = await supabase
          .from('users')
          .select('telegram_id')
          .eq('id', userId)
          .single();
        
        if (userData?.telegram_id && superAdminTelegramIds.includes(userData.telegram_id.toString())) {
          return {
            isAdmin: true,
            adminLevel: 'super',
            permissions: ['all']
          };
        }
      }

      // Check database for admin status
      const { data: adminData, error } = await supabase.rpc('check_admin_status', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error checking admin status:', error);
        return { isAdmin: false };
      }

      if (adminData?.is_admin) {
        return {
          isAdmin: true,
          adminLevel: adminData.admin_level,
          permissions: adminData.permissions || []
        };
      }

      return { isAdmin: false };
    } catch (error) {
      console.error('Admin auth service error:', error);
      return { isAdmin: false };
    }
  }

  /**
   * Check admin status by username
   */
  static async checkAdminStatusByUsername(username: string): Promise<AdminAuthResult> {
    try {
      // Get user ID from username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, telegram_id')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        return { isAdmin: false };
      }

      return this.checkAdminStatus(userData.id);
    } catch (error) {
      console.error('Admin auth by username error:', error);
      return { isAdmin: false };
    }
  }

  /**
   * Check admin status by Telegram ID
   */
  static async checkAdminStatusByTelegramId(telegramId: number): Promise<AdminAuthResult> {
    try {
      // Check environment variables first
      const superAdminTelegramIds = this.getSuperAdminTelegramIds();
      
      if (superAdminTelegramIds.includes(telegramId.toString())) {
        return {
          isAdmin: true,
          adminLevel: 'super',
          permissions: ['all']
        };
      }

      // Get user ID from telegram_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      if (userError || !userData) {
        return { isAdmin: false };
      }

      return this.checkAdminStatus(userData.id);
    } catch (error) {
      console.error('Admin auth by telegram ID error:', error);
      return { isAdmin: false };
    }
  }

  /**
   * Add a new admin user
   */
  static async addAdminUser(
    userId: number,
    adminLevel: 'super' | 'admin' | 'moderator' = 'admin',
    permissions: string[] = [],
    addedBy?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('add_admin_user', {
        p_user_id: userId,
        p_admin_level: adminLevel,
        p_permissions: permissions,
        p_added_by: addedBy
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove admin privileges
   */
  static async removeAdminUser(userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('remove_admin_user', {
        p_user_id: userId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all admin users
   */
  static async getAdminUsers(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_admin_users');

      if (error) {
        console.error('Error fetching admin users:', error);
        return [];
      }

      return data?.map((item: any) => ({
        id: item.user_id,
        username: item.username,
        telegram_id: item.telegram_id,
        is_admin: true,
        admin_level: item.admin_level,
        created_at: item.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  /**
   * Get super admin IDs from environment variables
   */
  private static getSuperAdminIds(): string[] {
    const adminIds = import.meta.env.VITE_SUPER_ADMIN_IDS || '';
    return adminIds.split(',')
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);
  }

  /**
   * Get super admin Telegram IDs from environment variables
   */
  private static getSuperAdminTelegramIds(): string[] {
    const telegramIds = import.meta.env.VITE_SUPER_ADMIN_TELEGRAM_IDS || '';
    return telegramIds.split(',')
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);
  }

  /**
   * Initialize admin system (create first admin)
   */
  static async initializeAdminSystem(
    firstAdminUserId: number,
    adminLevel: 'super' | 'admin' = 'super'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('initialize_admin_system', {
        p_first_admin_user_id: firstAdminUserId,
        p_admin_level: adminLevel
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: number, permission: string): Promise<boolean> {
    const adminStatus = await this.checkAdminStatus(userId);
    
    if (!adminStatus.isAdmin) return false;
    if (adminStatus.adminLevel === 'super') return true;
    if (adminStatus.permissions?.includes('all')) return true;
    if (adminStatus.permissions?.includes(permission)) return true;
    
    return false;
  }

  /**
   * Log admin action
   */
  static async logAdminAction(
    adminUserId: number,
    action: string,
    details: any = {},
    targetUserId?: number
  ): Promise<void> {
    try {
      await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: adminUserId,
          action,
          details,
          target_user_id: targetUserId,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }
}

// Helper functions for React components
export const useAdminAuth = () => {
  const checkIsAdmin = async (userId: number) => {
    return AdminAuthService.checkAdminStatus(userId);
  };

  const checkPermission = async (userId: number, permission: string) => {
    return AdminAuthService.hasPermission(userId, permission);
  };

  return {
    checkIsAdmin,
    checkPermission,
    AdminAuthService
  };
};