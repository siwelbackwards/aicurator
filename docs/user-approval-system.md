# User Approval System Implementation

## Overview

This document outlines the implementation of a user approval system for AI Curator, similar to platforms like Raya. New users must be approved by administrators before gaining full access to the platform.

## Features Implemented

### 1. Database Schema Changes
- **New columns added to `profiles` table:**
  - `user_status` (TEXT): 'pending', 'approved', 'rejected', 'suspended'
  - `status_changed_at` (TIMESTAMPTZ): Timestamp of status change
  - `status_changed_by` (UUID): Admin user who made the change
  - `admin_notes` (TEXT): Internal admin notes
  - `rejection_reason` (TEXT): Reason for rejection (shown to user)

### 2. User Registration Flow
- **Modified buyer onboarding** to set new users as 'pending' status
- **Pending approval page** (`/auth/pending-approval`) shows waitlist status
- **Automatic redirection** for pending/rejected users to status page

### 3. Admin Interface
- **New admin page** at `/admin/approvals` for reviewing user applications
- **Document verification** - admins can view uploaded ID and address proof
- **Approve/Reject actions** with optional notes and rejection reasons
- **Real-time updates** of pending user count

### 4. Authentication & Access Control
- **Enhanced AuthGate component** checks user status before granting access
- **Automatic redirects** for non-approved users
- **Status-aware authentication** flow

## Database Migration

The system includes a comprehensive migration file: `supabase/migrations/20250122_add_user_approval_system.sql`

### Key Database Objects Created:
- **Functions:**
  - `update_user_status()` - Secure function for admins to change user status
  - `get_user_status()` - Function for users to check their status

- **Views:**
  - `pending_users` - Admin-only view of users awaiting approval

- **Indexes:**
  - `idx_profiles_user_status` - For efficient status filtering
  - `idx_profiles_status_changed_at` - For sorting by status change time

## User Experience Flow

### For New Users:
1. **Sign up** through existing buyer onboarding flow
2. **Complete profile** with personal details and document uploads
3. **See success message** indicating submission for approval
4. **Redirected to pending approval page** with clear status information
5. **Receive email notification** when approved (future enhancement)

### For Administrators:
1. **Access admin dashboard** (`/admin`)
2. **Click "Review User Applications"** in quick actions
3. **View pending users** with their submitted information
4. **Review uploaded documents** (ID and address proof)
5. **Approve or reject** with optional notes
6. **Users automatically notified** of status changes

## Security Considerations

### Database Security:
- **RLS Policies** ensure users can only see their own status
- **Admin-only access** to user management functions
- **Audit trail** with status change timestamps and admin IDs

### Access Control:
- **Status-based routing** prevents unauthorized access
- **Client-side validation** supplemented by server-side checks
- **Secure document storage** with proper access controls

## API Endpoints

### Database Functions:
```sql
-- Admin function to update user status
SELECT update_user_status(user_id, 'approved', admin_id, 'Approved by admin', NULL);

-- User function to check their status
SELECT get_user_status(user_id);
```

### Client-side Hooks:
```typescript
const { status, loading, error, checkUserStatus } = useUserStatus(userId);
```

## File Structure

```
app/
├── admin/
│   └── approvals/
│       └── page.tsx          # Admin approval interface
├── auth/
│   └── pending-approval/
│       └── page.tsx          # User pending approval page
components/
├── auth/
│   ├── auth-gate.tsx         # Enhanced with status checking
│   └── buyer-onboarding.tsx  # Modified to set pending status
hooks/
└── use-user-status.ts        # User status checking hook
supabase/
└── migrations/
    └── 20250122_add_user_approval_system.sql
```

## Configuration

### Environment Variables
No additional environment variables required - uses existing Supabase configuration.

### Admin Setup
1. Ensure admin users have `role = 'admin'` in their profiles
2. Admin users automatically have access to the approvals interface
3. The system preserves existing admin permissions

## Future Enhancements

### Potential Improvements:
1. **Email notifications** for status changes
2. **Bulk approval/rejection** for multiple users
3. **Advanced filtering** and search in admin interface
4. **Audit logs** for all admin actions
5. **User appeal system** for rejections
6. **Auto-approval** rules based on criteria
7. **Document expiration** tracking
8. **Multi-admin approval** workflow

### Email Integration:
```typescript
// Future email notification system
const sendStatusNotification = async (userEmail, newStatus, reason?) => {
  // Send email to user about status change
};
```

## Testing Checklist

### User Registration:
- [ ] New users are set to 'pending' status
- [ ] Pending users see appropriate waitlist page
- [ ] Approved users can access all features
- [ ] Rejected users see rejection message

### Admin Interface:
- [ ] Admins can view pending users
- [ ] Document verification works correctly
- [ ] Approve/reject actions update user status
- [ ] Admin notes are saved properly

### Security:
- [ ] Non-admin users cannot access approval interface
- [ ] Users can only see their own status
- [ ] Database functions have proper security checks

## Troubleshooting

### Common Issues:

1. **Users stuck in pending state:**
   - Check admin access to approvals page
   - Verify database permissions
   - Check for JavaScript errors in admin interface

2. **Status not updating:**
   - Verify `update_user_status` function permissions
   - Check database connection
   - Ensure admin user has proper role

3. **Documents not displaying:**
   - Verify Supabase storage permissions
   - Check file upload paths
   - Ensure proper bucket access

## Migration Notes

### For Existing Users:
- Existing users with `onboarding_completed = true` are automatically set to 'approved' status
- No disruption to existing user access
- Admin functionality works immediately after migration

### Rollback Plan:
If issues arise, the system can be rolled back by:
1. Reverting the database migration
2. Removing the new admin page
3. Restoring original buyer onboarding flow
4. Removing status checks from AuthGate

## Performance Considerations

### Database Optimization:
- Indexes on frequently queried columns (`user_status`, `status_changed_at`)
- Efficient queries using the `pending_users` view
- Proper RLS policies to limit data access

### Client-side Optimization:
- Status checking cached in localStorage where appropriate
- Lazy loading of document verification
- Efficient re-renders with proper state management

---

## Conclusion

This user approval system provides a secure, user-friendly way to manage new user registrations similar to exclusive platforms like Raya. The implementation maintains backward compatibility while adding comprehensive admin controls and clear user communication throughout the approval process.
