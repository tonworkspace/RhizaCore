# Supabase Admin System Integration Guide

## Overview

This guide covers integrating the admin system with Supabase, supporting both UUID (Supabase auth) and integer (custom users table) user identification systems.

## 🏗️ Architecture Options

### Option 1: Supabase Auth (UUID) - Recommended
- Uses `auth.users` table with UUID primary keys
- Integrates with Supabase authentication
- Email-based admin identification
- Production-ready security

### Option 2: Custom Users Table (Integer)
- Uses custom `users` table with integer IDs
- Telegram ID and username support
- Custom authentication system
- More flexible user data

## 📋 Setup Instructions

### For Supabase Auth (UUID System)

#### 1. Deploy Database Schema
```sql
-- Run the UUID-compatible schema
\i create_admin_system_schema_uuid.sql
```

#### 2. Environment Variables
```bash
# Add to .env file
VITE_SUPER_ADMIN_EMAILS=admin@yourapp.com,owner@yourapp.com
```

#### 3. Initialize First Admin
```sql
-- Method 1: By email (easiest)
SELECT initialize_admin_system(
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
  'super'
);

-- Method 2: Direct UUID (if you know it)
SELECT initialize_admin_system('your-uuid-here', 'super');
```

#### 4. Use UUID Service in Code
```typescript
import { AdminAuthServiceUUID } from '../services/AdminAuthService_UUID';

// Check current user admin status
const adminStatus = await AdminAuthServiceUUID.getCurrentUserAdminStatus();

// Initialize by email
await AdminAuthServiceUUID.initializeAdminSystemByEmail('admin@yourapp.com', 'super');
```

### For Custom Users Table (Integer System)

#### 1. Deploy Database Schema
```sql
-- Run the integer-compatible schema
\i create_admin_system_schema.sql
```

#### 2. Environment Variables
```bash
# Add to .env file
VITE_SUPER_ADMIN_IDS=1,2,3
VITE_SUPER_ADMIN_TELEGRAM_IDS=123456789,987654321
```

#### 3. Initialize First Admin
```sql
-- By user ID
SELECT initialize_admin_system(1, 'super');

-- By username
SELECT initialize_admin_system(
  (SELECT id FROM users WHERE username = 'admin_user'),
  'super'
);
```

#### 4. Use Integer Service in Code
```typescript
import { AdminAuthService } from '../services/AdminAuthService';

// Check admin status
const adminStatus = await AdminAuthService.checkAdminStatus(userId);

// Initialize system
await AdminAuthService.initializeAdminSystem(userId, 'super');
```

## 🔧 Component Integration

### Update AdminPanel for UUID Support

```typescript
// src/components/AdminPanel.tsx
import { AdminAuthServiceUUID } from '../services/AdminAuthService_UUID';
import { useAuth } from '../hooks/useAuth';

const AdminPanel: React.FC<AdminPanelProps> = ({ showSnackbar }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLevel, setAdminLevel] = useState<string>('');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // For Supabase auth (UUID)
      const adminStatus = await AdminAuthServiceUUID.getCurrentUserAdminStatus();
      setIsAdmin(adminStatus.isAdmin);
      setAdminLevel(adminStatus.adminLevel || '');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  // Rest of component...
};
```

### Update AdminSetup for UUID Support

```typescript
// src/components/AdminSetup.tsx
import { AdminAuthServiceUUID } from '../services/AdminAuthService_UUID';

const AdminSetup: React.FC<AdminSetupProps> = ({ onClose, showSnackbar }) => {
  // Add email-based initialization
  const [email, setEmail] = useState('');

  const handleInitializeByEmail = async () => {
    if (!email) {
      showSnackbar?.({ message: 'Error', description: 'Please enter an email', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await AdminAuthServiceUUID.initializeAdminSystemByEmail(email, adminLevel);
      
      if (result.success) {
        showSnackbar?.({ 
          message: 'Success', 
          description: `Admin system initialized for ${email}`, 
          type: 'success' 
        });
        setIsInitialized(true);
        setEmail('');
      } else {
        showSnackbar?.({ message: 'Error', description: result.error, type: 'error' });
      }
    } catch (error: any) {
      showSnackbar?.({ message: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Add email input form...
};
```

## 🔐 Authentication Integration

### Supabase Auth Integration

```typescript
// src/hooks/useAdminAuth.ts
import { useEffect, useState } from 'react';
import { AdminAuthServiceUUID } from '../services/AdminAuthService_UUID';
import { supabase } from '../lib/supabaseClient';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminLevel, setAdminLevel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await checkAdminStatus();
        } else if (event === 'SIGNED_OUT') {
          setIsAdmin(false);
          setAdminLevel('');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const adminStatus = await AdminAuthServiceUUID.getCurrentUserAdminStatus();
      setIsAdmin(adminStatus.isAdmin);
      setAdminLevel(adminStatus.adminLevel || '');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAdmin,
    adminLevel,
    loading,
    checkAdminStatus
  };
};
```

### IndexPage Integration

```typescript
// src/pages/IndexPage/IndexPage.tsx
import { useAdminAuth } from '../hooks/useAdminAuth';

const IndexPageContent: FC = () => {
  const { isAdmin, adminLevel, loading } = useAdminAuth();

  // Use the hook values instead of local state
  const renderContent = () => {
    switch (activeBottomTab) {
      case 'Admin':
        if (process.env.NODE_ENV === 'development' && isAdmin) {
          return <AdminPanel showSnackbar={showSnackbar} />;
        }
        if (process.env.NODE_ENV === 'development' && !isAdmin && !loading) {
          return (
            <div className="flex items-center justify-center min-h-[60vh] text-center p-6">
              <div>
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icons.Lock size={32} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Admin Access Required</h3>
                <p className="text-zinc-400 mb-4">You need admin privileges to access this panel.</p>
                <p className="text-sm text-zinc-500">Contact a super admin or check the setup guide.</p>
              </div>
            </div>
          );
        }
        return null;
      // ... other cases
    }
  };

  // Rest of component...
};
```

## 🛡️ Security Configuration

### Row Level Security (RLS) Policies

The UUID schema includes comprehensive RLS policies:

```sql
-- Admin users can view admin_users table
CREATE POLICY "Admin users can view admin_users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = TRUE
        )
    );

-- Super admins can manage admin_users table
CREATE POLICY "Super admins can manage admin_users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.admin_level = 'super' 
            AND au.is_active = TRUE
        )
    );
```

### Environment Variables Security

```bash
# Development (.env.local)
VITE_SUPER_ADMIN_EMAILS=dev@yourapp.com

# Production (secure environment)
SUPER_ADMIN_EMAILS=admin@yourapp.com,owner@yourapp.com
```

## 📊 Admin Management UI

### Admin User Management Component

```typescript
// src/components/AdminUserManagement.tsx
import React, { useState, useEffect } from 'react';
import { AdminAuthServiceUUID } from '../services/AdminAuthService_UUID';

const AdminUserManagement: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      const users = await AdminAuthServiceUUID.getAdminUsers();
      setAdminUsers(users);
    } catch (error) {
      console.error('Error loading admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (email: string, level: 'admin' | 'moderator') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user ID by email
      const { data: targetUserId } = await supabase
        .rpc('get_user_id_by_email', { p_email: email });

      if (!targetUserId) {
        alert('User not found');
        return;
      }

      const result = await AdminAuthServiceUUID.addAdminUser(
        targetUserId,
        level,
        level === 'admin' ? ['user_management', 'activation'] : ['moderation'],
        user.id
      );

      if (result.success) {
        await loadAdminUsers();
        alert('Admin added successfully');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding admin:', error);
    }
  };

  // Render admin management UI...
};
```

## 🧪 Testing

### Test Admin Functions

```javascript
// test-admin-system-uuid.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminSystem() {
  console.log('🧪 Testing UUID Admin System...\n');

  try {
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }

    console.log('✅ Current user:', user.email);

    // 2. Check admin status
    const { data: adminStatus } = await supabase.rpc('check_admin_status', {
      p_user_id: user.id
    });

    console.log('📊 Admin status:', adminStatus);

    // 3. Get all admin users
    const { data: adminUsers } = await supabase.rpc('get_admin_users');
    console.log('👥 Admin users:', adminUsers?.length || 0);

    // 4. Test initialization (if not already initialized)
    if (!adminStatus?.is_admin) {
      console.log('🔧 Initializing admin system...');
      const { data: initResult } = await supabase.rpc('initialize_admin_system', {
        p_first_admin_user_id: user.id,
        p_admin_level: 'super'
      });
      console.log('🎉 Initialization result:', initResult);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminSystem();
```

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] Choose UUID or Integer system based on your auth setup
- [ ] Deploy appropriate database schema
- [ ] Set environment variables for super admins
- [ ] Test admin functions in development
- [ ] Verify RLS policies are working

### Production Deployment

- [ ] Deploy database schema to production
- [ ] Set production environment variables
- [ ] Initialize first admin user
- [ ] Test admin access in production
- [ ] Verify security policies
- [ ] Document admin procedures for team

### Post-deployment

- [ ] Create additional admin users as needed
- [ ] Set up monitoring for admin actions
- [ ] Regular security audits
- [ ] Backup admin user list
- [ ] Document recovery procedures

## 🔍 Troubleshooting

### Common Issues

**1. "User not found" when initializing**
```sql
-- Check if user exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- If using custom users table
SELECT id, username FROM users WHERE username = 'your-username';
```

**2. RLS policies blocking access**
```sql
-- Temporarily disable RLS for testing (development only!)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

**3. Environment variables not working**
- Check variable names: `VITE_` prefix for frontend
- Restart development server after changes
- Verify .env file location and syntax

### Debug Commands

```sql
-- Check admin system status
SELECT COUNT(*) as admin_count FROM admin_users WHERE is_active = true;

-- View admin logs
SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 10;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE tablename = 'admin_users';
```

## 📚 Best Practices

### Development
1. **Use environment variables** for quick admin access
2. **Test both UUID and integer systems** if supporting both
3. **Use proper TypeScript types** for better development experience
4. **Implement proper error handling** in all admin functions

### Production
1. **Use database-driven admin management** for persistence
2. **Implement proper audit logging** for compliance
3. **Regular permission reviews** and updates
4. **Secure environment variable management**

### Security
1. **Limit super admin count** (2-3 maximum recommended)
2. **Use specific permissions** instead of 'all' when possible
3. **Regular security audits** of admin actions
4. **Implement session management** for enhanced security
5. **Monitor admin activity** through logs and alerts

This comprehensive integration guide ensures your admin system works seamlessly with Supabase while maintaining security and flexibility.