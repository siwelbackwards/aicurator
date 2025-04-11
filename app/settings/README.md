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

Run the SQL in `profiles-schema.sql` in your Supabase SQL editor to:
- Create the profiles table (if it doesn't exist)
- Add necessary columns
- Configure RLS (Row Level Security) policies

#### Storage Setup

Run the SQL in `setup.sql` in your Supabase SQL editor to:
- Create an "avatars" storage bucket
- Configure proper RLS policies for the bucket

### 2. Environment Variables

Ensure your `.env` file has the required Supabase configuration:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

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