# Admin User Setup Guide

## Overview

This guide covers all methods for setting up admin users in your RhizaCore application. There are multiple approaches depending on your needs and environment.

## 🚀 Quick Setup Methods

### Method 1: Environment Variables (Recommended for Development)

Add these environment variables to your `.env` file:

```bash
# Super Admin User IDs (comma-separated)
VITE_SUPER_ADMIN_IDS=1,2,3

# Super Admin Telegram IDs (comma-separated) 
VITE_SUPER_ADMIN_TELEGRAM_IDS=123456789,987654321

# Optional: Regular Admin IDs
VITE_ADMIN_IDS=4,5,6
VITE_ADMIN_TELEGRAM_IDS=111111111,222222222
```

**Benefits:**
- ✅ Immediate access without database setup
- ✅ Perfect for development and testing
- ✅ No database dependencies
- ✅ Easy to change and manage

**Usage:**
Users with these IDs automatically get admin privileges when they log in.

### Method 2: Database Setup (Recommended for Production)

#### Step 1: Run Database Schema
```sql
-- Run the admin system schema
\i create_admin_system_schema.sql
```

#### Step 2: Initialize First Admin
Use one of these methods:

**By User ID:**
```sql
SELECT initialize_admin_system(1, 'super');
```

**By Username:**
```sql
-- First get user ID
SELECT id FROM users WHERE username = 'your_username';
-- Then initialize (replace 123 with actual ID)
SELECT initialize_admin_system(123, 'super');
```

**By Telegram ID:**
```sql
-- First get user ID  
SELECT id FROM users WHERE telegram_id = 123456789;
-- Then initialize (replace 123 with actual ID)
SELECT initialize_admin_system(123, 'super');
```

### Method 3: Admin Setup UI (Easiest)

1. **Access Admin Panel** (development mode only)
2. **Click "Admin Setup"** button
3. **Choose setup method:**
   - By User ID
   - By Username  
   - By Telegram ID
   - Environment Variables
4. **Enter details and initialize**

## 🛠️ Database Schema

### Tables Created

1. **admin_users** - Stores admin user information
2. **admin_logs** - Audit trail of admin actions
3. **admin_sessions** - Session management (optional)

### Admin Levels

- **super** - Full system access, can manage other admins
- **admin** - Standard admin access, user management
- **moderator** - Limited access, basic moderation

### Permissions System

Permissions are stored as arrays and can include:
- `all` - Full access (super admins)
- `user_management` - Manage users
- `activation` - User activation functions
- `reports` - View reports and analytics
- `moderation` - Content moderation

## 🔧 Management Functions

### Add New Admin
```typescript
// Via service
await AdminAuthService.addAdminUser(userId, 'admin', ['user_management', 'activation']);

// Via SQL
SELECT add_admin_user(123, 'admin', ARRAY['user_management', 'activation'], 1);
```

### Check Admin Status
```typescript
// Via service
const status = await AdminAuthService.checkAdminStatus(userId);

// Via SQL
SELECT check_admin_status(123);
```

### Remove Admin
```typescript
// Via service
await AdminAuthService.removeAdminUser(userId);

// Via SQL
SELECT remove_admin_user(123, 1);
```

### Update Permissions
```sql
SELECT update_admin_permissions(123, ARRAY['user_management', 'reports'], 1);
```

## 🔐 Security Features

### Environment-Based Access
- Super admins defined in environment variables
- Automatic privilege detection
- No database dependency for core admins

### Database Security
- Row Level Security (RLS) enabled
- Audit logging for all admin actions
- Session management support
- Permission-based access control

### Access Control
```typescript
// Check if user has specific permission
const canManageUsers = await AdminAuthService.hasPermission(userId, 'user_management');

// Check admin level
const adminStatus = await AdminAuthService.checkAdminStatus(userId);
if (adminStatus.adminLevel === 'super') {
  // Super admin actions
}
```

## 📱 UI Integration

### Admin Panel Access
The admin panel automatically:
- ✅ Checks user admin status
- ✅ Shows appropriate UI based on permissions
- ✅ Provides setup interface for initialization
- ✅ Displays admin level and permissions

### Development Mode
- Admin tab only visible in development
- DEV badge in header when active
- Full admin functionality available
- Safe for production (automatically hidden)

## 🚨 Production Setup

### 1. Database Initialization
```sql
-- Initialize with your user ID
SELECT initialize_admin_system(YOUR_USER_ID, 'super');
```

### 2. Environment Variables (Optional)
```bash
# Production super admins (optional backup access)
SUPER_ADMIN_IDS=1,2
SUPER_ADMIN_TELEGRAM_IDS=123456789
```

### 3. Security Checklist
- [ ] Database schema deployed
- [ ] First admin user created
- [ ] RLS policies active
- [ ] Admin logs table created
- [ ] Environment variables secured
- [ ] Admin panel access tested

## 🔍 Monitoring & Audit

### View Admin Actions
```sql
-- Recent admin actions
SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 20;

-- Actions by specific admin
SELECT * FROM admin_logs WHERE admin_user_id = 123;

-- Actions on specific user
SELECT * FROM admin_logs WHERE target_user_id = 456;
```

### Admin Statistics
```sql
-- Current admin users
SELECT * FROM get_admin_users();

-- Admin activity summary
SELECT 
  action,
  COUNT(*) as count,
  DATE(created_at) as date
FROM admin_logs 
GROUP BY action, DATE(created_at)
ORDER BY date DESC;
```

## 🛠️ Troubleshooting

### Common Issues

**1. "Access Denied" in Admin Panel**
- Check if user ID is in environment variables
- Verify database admin_users table has entry
- Confirm user exists in users table

**2. "Admin system not initialized"**
- Run database schema: `create_admin_system_schema.sql`
- Initialize first admin: `SELECT initialize_admin_system(USER_ID, 'super');`

**3. Environment variables not working**
- Check variable names: `VITE_SUPER_ADMIN_IDS` for frontend
- Restart development server after changes
- Verify .env file is in project root

**4. Database permissions error**
- Ensure RLS policies are created
- Check user authentication in Supabase
- Verify function permissions granted

### Debug Commands

```sql
-- Check if admin tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('admin_users', 'admin_logs');

-- Check admin users
SELECT * FROM admin_users WHERE is_active = true;

-- Check user exists
SELECT id, username, telegram_id FROM users WHERE id = YOUR_ID;

-- Test admin function
SELECT check_admin_status(YOUR_USER_ID);
```

## 📋 Best Practices

### Development
1. **Use environment variables** for quick admin access
2. **Test with multiple admin levels** to verify permissions
3. **Use Admin Setup UI** for easy initialization
4. **Monitor admin logs** during development

### Production
1. **Initialize via database** for permanent setup
2. **Use minimal environment variables** (backup access only)
3. **Regular audit log reviews** for security
4. **Backup admin user creation** before major changes
5. **Document admin procedures** for your team

### Security
1. **Limit super admin count** (2-3 maximum)
2. **Use specific permissions** instead of 'all' when possible
3. **Regular permission reviews** and updates
4. **Monitor admin activity** through logs
5. **Secure environment variables** in production

## 🎯 Example Workflows

### New Project Setup
1. Add your Telegram ID to `VITE_SUPER_ADMIN_TELEGRAM_IDS`
2. Start development server
3. Access admin panel to test functionality
4. When ready for production, use database initialization

### Adding Team Member as Admin
1. Get their user ID from database
2. Use Admin Panel or run: `SELECT add_admin_user(USER_ID, 'admin', ARRAY['user_management']);`
3. Verify access in admin logs

### Emergency Admin Access
1. Add your ID to environment variables
2. Restart application
3. Access admin panel immediately
4. Fix issues and remove from env vars

This comprehensive setup system ensures you can always access admin functionality while maintaining security and auditability.