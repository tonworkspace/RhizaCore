# Auto User Activation System - Complete Guide

## Overview

The Auto User Activation System provides administrators with powerful tools to automatically activate user wallets without requiring manual payment processing. This system is designed for testing, bulk operations, and special circumstances where manual activation is needed.

## Components

### 1. Database Functions (`auto_user_activation_system.sql`)

**Core Functions:**
- `auto_activate_user(user_id, reason, rzc_amount)` - Activate single user by ID
- `auto_activate_user_by_username(username, reason, rzc_amount)` - Activate by username
- `auto_activate_user_by_telegram(telegram_id, reason, rzc_amount)` - Activate by Telegram ID
- `bulk_auto_activate_users(user_ids[], reason, rzc_amount)` - Bulk activate multiple users
- `auto_activate_users_by_criteria(...)` - Activate users matching criteria
- `get_activation_stats()` - Get activation statistics
- `preview_activation_candidates(...)` - Preview users before activation

### 2. Service Layer (`AutoActivationService.ts`)

**TypeScript service providing:**
- Type-safe interfaces for all activation operations
- Error handling and validation
- Convenience helper functions
- Bulk operation support

### 3. Admin UI Component (`AdminAutoActivation.tsx`)

**React component featuring:**
- Real-time activation statistics
- Multiple activation methods (ID, username, Telegram ID)
- Bulk activation interface
- Quick action buttons for common scenarios
- Safety warnings and confirmations

## Usage Examples

### Single User Activation

```typescript
// By User ID
const result = await AutoActivationService.activateUserById(123, 'Manual override', 150);

// By Username
const result = await AutoActivationService.activateUserByUsername('john_doe', 'Support request', 150);

// By Telegram ID
const result = await AutoActivationService.activateUserByTelegramId(123456789, 'Telegram support', 150);
```

### Bulk Operations

```typescript
// Activate multiple users by ID
const result = await AutoActivationService.bulkActivateUsers([123, 124, 125], 'Batch processing', 150);

// Activate users by criteria
const result = await AutoActivationService.activateUsersByCriteria({
  createdAfter: new Date('2024-01-01'),
  usernamePattern: 'test',
  reason: 'Test environment setup',
  rzcAmount: 150,
  limit: 100
});
```

### Helper Functions

```typescript
// Activate test users
const result = await autoActivationHelpers.activateTestUsers();

// Activate today's users
const result = await autoActivationHelpers.activateTodayUsers();

// Activate recent users (last 24 hours)
const result = await autoActivationHelpers.activateRecentUsers();
```

## Admin UI Usage

### Opening the Admin Panel

The `AdminAutoActivation` component can be integrated into your admin interface:

```typescript
import AdminAutoActivation from '../components/AdminAutoActivation';

// In your admin component
const [showAutoActivation, setShowAutoActivation] = useState(false);

return (
  <>
    <button onClick={() => setShowAutoActivation(true)}>
      Auto Activation Panel
    </button>
    
    {showAutoActivation && (
      <AdminAutoActivation
        onClose={() => setShowAutoActivation(false)}
        showSnackbar={showSnackbar}
      />
    )}
  </>
);
```

### Panel Features

1. **Statistics Dashboard** - Real-time view of activation metrics
2. **Single User Activation** - Activate by ID, username, or Telegram ID
3. **Bulk Activation** - Process multiple users at once
4. **Quick Actions** - Common scenarios like test users or daily batches
5. **Safety Features** - Warnings and confirmation dialogs

## Database Schema Impact

### Tables Modified

1. **users** - Sets `wallet_activated = true` and `wallet_activated_at`
2. **wallet_activations** - Creates activation record with auto-generated transaction hash
3. **airdrop_balances** - Adds RZC tokens to user's balance
4. **activities** - Records activation activity for audit trail

### Transaction Hashes

Auto-activated users get special transaction hashes:
- Format: `AUTO_{user_id}_{timestamp}`
- Example: `AUTO_123_1642781234`

## Security Considerations

### Access Control

- Admin functions should be protected by proper authentication
- Consider implementing role-based access control
- Log all activation operations for audit purposes

### Safety Features

1. **Preview Mode** - Always preview users before bulk operations
2. **Limits** - Built-in limits prevent accidental mass activation
3. **Confirmation** - UI requires explicit confirmation for bulk operations
4. **Audit Trail** - All activations are logged with reason and timestamp

### Recommended Safeguards

```typescript
// Always preview before bulk operations
const preview = await AutoActivationService.previewActivationCandidates({
  usernamePattern: 'test'
});

console.log('Users to be activated:', preview);

// Only proceed after manual confirmation
if (confirm(`Activate ${preview.length} users?`)) {
  const result = await AutoActivationService.activateUsersByCriteria({
    usernamePattern: 'test'
  });
}
```

## Testing

### Running Tests

```bash
# Install dependencies
npm install @supabase/supabase-js

# Set environment variables
export VITE_SUPABASE_URL="your-supabase-url"
export VITE_SUPABASE_ANON_KEY="your-supabase-key"

# Run tests
node test-auto-activation.js
```

### Test Scenarios

1. **Single User Activation** - Test each activation method
2. **Bulk Operations** - Test with small batches first
3. **Error Handling** - Test with invalid user IDs
4. **Statistics** - Verify stats update correctly
5. **Preview Mode** - Ensure preview matches actual results

## Common Use Cases

### Development Environment

```sql
-- Activate all test users
SELECT auto_activate_users_by_criteria(NULL, NULL, 'test', 'Dev environment setup');

-- Activate specific test accounts
SELECT bulk_auto_activate_users(ARRAY[101, 102, 103], 'Test account setup');
```

### Production Support

```sql
-- Activate user with payment issue
SELECT auto_activate_user(12345, 'Payment verification completed manually');

-- Activate users from promotional campaign
SELECT auto_activate_users_by_criteria('2024-01-01', '2024-01-31', 'promo', 'Campaign activation');
```

### Bulk Operations

```sql
-- Daily activation batch
SELECT auto_activate_users_by_criteria(CURRENT_DATE, NULL, NULL, 'Daily batch activation');

-- Activate recent signups
SELECT auto_activate_users_by_criteria(NOW() - INTERVAL '24 hours', NULL, NULL, 'Recent user activation');
```

## Monitoring and Analytics

### Key Metrics

- Total users vs activated users
- Daily activation rate
- Auto vs manual activations
- Error rates and common failure reasons

### SQL Queries for Monitoring

```sql
-- Daily activation summary
SELECT 
  DATE(wallet_activated_at) as date,
  COUNT(*) as activations,
  SUM(CASE WHEN transaction_hash LIKE 'AUTO_%' THEN 1 ELSE 0 END) as auto_activations
FROM users 
WHERE wallet_activated = true 
GROUP BY DATE(wallet_activated_at) 
ORDER BY date DESC;

-- Error analysis
SELECT 
  reason,
  COUNT(*) as count
FROM activities 
WHERE type = 'auto_wallet_activation' 
AND status = 'failed'
GROUP BY reason;
```

## Troubleshooting

### Common Issues

1. **User Not Found** - Verify user ID/username exists
2. **Already Activated** - Check user's current activation status
3. **Database Permissions** - Ensure RLS policies allow admin operations
4. **Balance Issues** - Verify airdrop_balances table structure

### Debug Commands

```sql
-- Check user status
SELECT id, username, wallet_activated, wallet_activated_at 
FROM users WHERE id = 123;

-- Check activation record
SELECT * FROM wallet_activations WHERE user_id = 123;

-- Check RZC balance
SELECT * FROM airdrop_balances WHERE user_id = 123;

-- Check activity log
SELECT * FROM activities WHERE user_id = 123 AND type = 'auto_wallet_activation';
```

## Best Practices

1. **Always Preview** - Use preview functions before bulk operations
2. **Start Small** - Test with small batches before large operations
3. **Document Reasons** - Always provide clear activation reasons
4. **Monitor Results** - Check statistics after operations
5. **Backup First** - Consider database backups before mass operations
6. **Test Environment** - Validate in staging before production use

## API Integration

The system can be integrated into external tools via the Supabase API:

```javascript
// External script example
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

// Activate user via API
const { data, error } = await supabase.rpc('auto_activate_user', {
  p_user_id: 123,
  p_reason: 'External system activation'
});
```

This comprehensive system provides administrators with powerful, safe, and auditable tools for managing user wallet activations at scale.