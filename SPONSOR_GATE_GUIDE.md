# Sponsor Gate Administration Guide

This guide explains how to open the sponsor gate as an admin and for the first user, and how to verify if it's functioning properly.

## Overview

The sponsor gate is a security feature that requires users to have a sponsor before accessing the main application. However, there are several ways to bypass this gate for administrative purposes.

## How the Sponsor Gate Works

The sponsor gate is controlled by these conditions:
- `showSponsorGate && hasSponsor === false && user`
- It checks if a user has a sponsor in the `referrals` table
- If no sponsor is found, the gate is displayed

## Bypass Methods

### 1. First User Automatic Bypass

The first user (earliest `created_at` timestamp) automatically bypasses the sponsor gate:

```typescript
// Check if user is the first user (admin bypass)
const { data: firstUser } = await supabase
  .from('users')
  .select('id')
  .order('created_at', { ascending: true })
  .limit(1)
  .single();

// If this is the first user, bypass sponsor gate
if (firstUser?.id === user.id) {
  setHasSponsor(true);
  setShowSponsorGate(false);
  return;
}
```

### 2. First User Default Codes

The first user can use special codes to generate an admin sponsor code:
- `admin`
- `system`
- `default`

When entered, these codes will:
1. Verify the user is the first user
2. Generate an admin sponsor code like `ADMIN-0001`
3. Set this as their sponsor code

### 3. Admin Bypass Button (Testing)

For testing purposes, there's a "Admin Bypass (Testing)" button on the sponsor gate that:
- Sets `adminBypass` state to `true`
- Immediately bypasses the sponsor gate
- Allows access to the main application

### 4. Database-Level Setup

Run the SQL script to set up the first user:

```sql
-- Execute this in your Supabase SQL editor
\i setup_first_user_sponsor_code.sql
```

This will:
- Find the first user by `created_at`
- Generate an admin sponsor code
- Update the user record

## Testing and Verification

### Using the Sponsor Gate Tester

A testing utility has been created at `src/utils/sponsorGateTester.ts`:

```typescript
import { testSponsorGate } from '@/utils/sponsorGateTester';

// Test first user bypass
await testSponsorGate.firstUser();

// Test sponsor gate logic for specific user
await testSponsorGate.logic(userId);

// Validate sponsor code
await testSponsorGate.validate('12345');

// Run all tests
await testSponsorGate.all(userId);
```

### Manual Testing Steps

1. **Test First User Bypass:**
   - Log in as the first user (earliest created user)
   - Verify the sponsor gate doesn't appear
   - Check console for bypass confirmation

2. **Test Default Codes:**
   - Log in as first user
   - If sponsor gate appears, enter `admin`, `system`, or `default`
   - Verify admin sponsor code is generated

3. **Test Admin Bypass Button:**
   - Log in as any user
   - If sponsor gate appears, click "Admin Bypass (Testing)"
   - Verify immediate access to main application

4. **Test Regular User Flow:**
   - Log in as a non-first user
   - Verify sponsor gate appears
   - Enter a valid sponsor code
   - Verify successful sponsor assignment

## Database Queries for Verification

### Check First User
```sql
SELECT id, username, telegram_id, sponsor_code, created_at
FROM users 
ORDER BY created_at ASC 
LIMIT 1;
```

### Check User's Sponsor Status
```sql
SELECT u.id, u.username, r.sponsor_id, s.username as sponsor_username
FROM users u
LEFT JOIN referrals r ON u.id = r.referred_id
LEFT JOIN users s ON r.sponsor_id = s.id
WHERE u.id = YOUR_USER_ID;
```

### Generate Sponsor Codes for All Users
```sql
SELECT generate_sponsor_codes();
```

### Check if User is First User
```sql
SELECT is_first_user(YOUR_USER_ID);
```

## Troubleshooting

### Sponsor Gate Still Shows for First User
1. Check if user is actually the first user by `created_at`
2. Verify the bypass logic is working
3. Check browser console for errors
4. Ensure database connection is working

### Default Codes Not Working
1. Verify user is the first user
2. Check if user already has a sponsor code
3. Ensure database update permissions
4. Check for JavaScript errors in console

### Admin Bypass Not Working
1. Check if `adminBypass` state is being set
2. Verify the bypass logic in `checkSponsorStatus`
3. Ensure the button click handler is working

## Security Considerations

1. **Admin Bypass Button:** This is for testing only and should be removed in production
2. **First User Bypass:** This is intentional for system initialization
3. **Default Codes:** Only work for the first user for security
4. **Database Access:** Ensure proper RLS policies are in place

## Production Deployment

Before deploying to production:

1. Remove or disable the "Admin Bypass (Testing)" button
2. Ensure proper database security policies
3. Test all bypass methods thoroughly
4. Verify first user has proper admin privileges
5. Document any custom admin procedures

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify database connectivity
3. Run the sponsor gate tests
4. Check user permissions and database policies
5. Review the troubleshooting section above
