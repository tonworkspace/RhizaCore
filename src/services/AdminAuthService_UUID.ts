import { supabase } from '../lib/supabaseClient';

export interface AdminUser {
  user_id: string; // UUID
  email: string;
  is_admin: boolean;
  admin_level: 'super' | 'admin' | 'moderator';
  created_at: string;
}

export interface AdminAuthResult {
  isAdmin: boolean;
  adminLevel?: 'super' | 'admin' | 'moderator';
  permissions?: string[];
}

export class AdminAuthServiceUUID {
  
  /**
   * Check if a user is an admin (UUID version)
   */
  static async checkAdminStatus(userId: string): Promise<AdminAuthResult> {
    try {
      // First check environment variables for super admin
      const superAdminEmails = this.getSuperAdminEmails();
      
      // Get user email to check against environment
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.email && superAdminEmails.includes(userData.user.email)) {
        return {
          isAdmin: true,
          adminLevel: 'super',
          permissions: ['all']
        };
      }

      // Check database for admin status
      const { data: adminData, error } = await supabase
        .rpc('check_admin_status', { p_user_id: userId });

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
   * Check admin status by email
   */
  static async checkAdminStatusByEmail(email: string): Promise<AdminAuthResult> {
    try {
      // Check environment variables first
      const superAdminEmails = this.getSuperAdminEmails();
      
      if (superAdminEmails.includes(email)) {
        return {
          isAdmin: true,
          adminLevel: 'super',
          permissions: ['all']
        };
      }

      // Get user ID from email
      const { data: userId, error: userError } = await supabase
        .rpc('get_user_id_by_email', { p_email: email });

      if (userError || !userId) {
        return { isAdmin: false };
      }

      return this.checkAdminStatus(userId);
    } catch (error) {
      console.error('Admin auth by email error:', error);
      return { isAdmin: false };
    }
  }

  /**
   * Add a new admin user (UUID version)
   */
  static async addAdminUser(
    userId: string,
    adminLevel: 'super' | 'admin' | 'moderator' = 'admin',
    permissions: string[] = [],
    addedBy?: string
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

      if (data?.success) {
        return { success: true };
      } else {
        return { success: false, error: data?.error || 'Failed to add admin user' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove admin privileges (UUID version)
   */
  static async removeAdminUser(userId: string, removedBy?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('remove_admin_user', {
        p_user_id: userId,
        p_removed_by: removedBy
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return { success: true };
      } else {
        return { success: false, error: data?.error || 'Failed to remove admin user' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all admin users (UUID version)
   */
  static async getAdminUsers(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_admin_users');

      if (error) {
        console.error('Error fetching admin users:', error);
        return [];
      }

      return data?.map((item: any) => ({
        user_id: item.user_id,
        email: item.email,
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
   * Initialize admin system (UUID version)
   */
  static async initializeAdminSystem(
    firstAdminUserId: string,
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

      if (data?.success) {
        return { success: true };
      } else {
        return { success: false, error: data?.error || 'Failed to initialize admin system' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize admin system by email
   */
  static async initializeAdminSystemByEmail(
    email: string,
    adminLevel: 'super' | 'admin' = 'super'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user ID from email
      const { data: userId, error: userError } = await supabase
        .rpc('get_user_id_by_email', { p_email: email });

      if (userError || !userId) {
        return { success: false, error: 'User not found with that email' };
      }

      return this.initializeAdminSystem(userId, adminLevel);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current user's admin status
   */
  static async getCurrentUserAdminStatus(): Promise<AdminAuthResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { isAdmin: false };
      }

      return this.checkAdminStatus(user.id);
    } catch (error) {
      console.error('Error getting current user admin status:', error);
      return { isAdmin: false };
    }
  }

  /**
   * Check if current user has specific permission
   */
  static async currentUserHasPermission(permission: string): Promise<boolean> {
    const adminStatus = await this.getCurrentUserAdminStatus();
    
    if (!adminStatus.isAdmin) return false;
    if (adminStatus.adminLevel === 'super') return true;
    if (adminStatus.permissions?.includes('all')) return true;
    if (adminStatus.permissions?.includes(permission)) return true;
    
    return false;
  }

  /**
   * Get super admin emails from environment variables
   */
  private static getSuperAdminEmails(): string[] {
    const adminEmails = process.env.VITE_SUPER_ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAILS || '';
    return adminEmails.split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  /**
   * Log admin action (UUID version)
   */
  static async logAdminAction(
    action: string,
    details: any = {},
    targetUserId?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      await supabase
        .from('admin_logs')
        .insert({
          admin_user_id: user.id,
          action,
          details,
          target_user_id: targetUserId
        });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Update admin permissions (UUID version)
   */
  static async updateAdminPermissions(
    userId: string,
    permissions: string[],
    updatedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('update_admin_permissions', {
        p_user_id: userId,
        p_permissions: permissions,
        p_updated_by: updatedBy
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return { success: true };
      } else {
        return { success: false, error: data?.error || 'Failed to update permissions' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Helper hook for React components (UUID version)
export const useAdminAuthUUID = () => {
  const checkIsAdmin = async (userId?: string) => {
    if (userId) {
      return AdminAuthServiceUUID.checkAdminStatus(userId);
    } else {
      return AdminAuthServiceUUID.getCurrentUserAdminStatus();
    }
  };

  const checkPermission = async (permission: string) => {
    return AdminAuthServiceUUID.currentUserHasPermission(permission);
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  return {
    checkIsAdmin,
    checkPermission,
    getCurrentUser,
    AdminAuthServiceUUID
  };
};