# User Profile Settings

This module allows users to update their profile information (name and avatar) and manage notification preferences.

## Features

- Profile image upload using Supabase Storage
- Profile name updating
- Notification preference management
- Responsive design for mobile and desktop

## Setup Requirements

### 1. Supabase Configuration

#### Database Setup

For the user profile functionality to work correctly, run these SQL scripts in your Supabase SQL editor in the following order:

1. Run `profiles-schema.sql` to:
   - Create the profiles table (if it doesn't exist)
   - Add necessary columns
   - Configure RLS (Row Level Security) policies for profiles

2. Run `user-settings-schema.sql` to:
   - Create the user_settings table
   - Set up RLS policies for user settings
   - Create the trigger to automatically add profile records when users sign up

#### Storage Setup

3. Run `setup.sql` to:
   - Create the "avatars" storage bucket
   - Configure RLS policies for avatar uploads

### 2. Environment Variables

Ensure your `.env` file has the required Supabase configuration:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Troubleshooting RLS Issues

If you encounter "violates row-level security policy" errors:

1. Make sure you've run all SQL scripts in the correct order
2. Check that the user is authenticated before attempting to update profiles
3. Verify RLS policies are properly set up for both:
   - INSERT and UPDATE in the profiles table
   - INSERT and UPDATE in the user_settings table
   - File operations in the avatars storage bucket

## Components

- **Settings Page**: Main settings interface (`app/settings/page.tsx`)
- **Avatar Upload**: Reusable component for avatar uploads (`components/profile/avatar-upload.tsx`)

## Usage

The settings page provides two main sections:

1. **Profile Information**:
   - User can update their display name
   - User can upload or change profile picture

2. **Notification Settings**:
   - Toggle email notifications
   - Toggle marketing communications
   - Toggle product updates

## Notes

- Avatar images are limited to 2MB
- Supported image formats: JPEG, PNG, GIF, WEBP
- Uploaded avatars are stored with the user's ID as the folder name for isolation 