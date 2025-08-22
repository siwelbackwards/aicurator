# Trending Products Admin Management System

## Overview
The Trending Products system allows admins to manually select and manage the top 8 products displayed on the homepage instead of relying on automatic price-based selection.

## System Architecture

### 1. Database Schema (`admin_trending_products` table)
- **Location**: `supabase/migrations/20250121_create_trending_products_admin.sql`
- **Fields**:
  - `id` (UUID, Primary Key)
  - `artwork_id` (Foreign key to artworks table)
  - `display_order` (Position 1-8)
  - `is_active` (Show/hide product)
  - `created_at`, `updated_at` (Timestamps)

### 2. Database View (`trending_products_view`)
- **Purpose**: Combines trending selections with artwork details
- **Includes**: Product info, images, and display order
- **Filtering**: Only active products, ordered by display order

### 3. API Endpoints

#### Admin API (`/admin/trending-products`)
- **Methods**: GET, POST, PUT, DELETE
- **Purpose**: Full CRUD operations for trending products
- **Security**: Admin-only access

#### Netlify Function (`admin-trending-products.js`)
- **Purpose**: Handles database operations
- **Features**: Comprehensive error handling and fallback support

### 4. Admin Interface

#### Main Features:
- **Product Selection**: Browse all approved artworks
- **Search & Filter**: Find products by title, artist, or category
- **Order Management**: Set display positions (1-8)
- **Active/Inactive Toggle**: Show/hide individual products
- **Maximum Limit**: Enforced 8-product limit

#### User Experience:
- **Dual Panel Layout**: Current trending vs. available products
- **Real-time Updates**: Changes reflect immediately
- **Visual Feedback**: Product thumbnails and details
- **Drag & Drop Ready**: Foundation for future reordering

## Setup Instructions

### 1. Database Migration
```sql
-- Run this in your Supabase SQL Editor
-- File: supabase/migrations/20250121_create_trending_products_admin.sql
```

### 2. Deploy Netlify Functions
The functions will deploy automatically with your next deployment.

### 3. Access the System
- **Admin Navigation**: Click "Trending Products" in admin menu
- **Quick Access**: Available in admin dashboard quick actions

## Usage Guide

### Selecting Products
1. **Navigate** to `/admin/trending-products`
2. **Browse** available approved artworks
3. **Search/Filter** by title, artist, or category
4. **Click "Add"** to include products in trending list

### Managing Order
- **Display Order**: Set position (1-8) for each product
- **Automatic Assignment**: New products get next available number
- **Manual Override**: Edit order numbers as needed

### Product Management
- **Remove Products**: Click "Remove" to exclude from trending
- **Toggle Visibility**: Use "Show/Hide" to control display
- **Maximum Limit**: System prevents adding more than 8

## Homepage Integration

### Smart Fallback System
1. **Primary**: Uses admin-selected trending products
2. **Secondary**: Falls back to automatic price-based selection
3. **Graceful**: Handles both development and production environments

### Data Flow
1. **Homepage Loads**: `TrendingProducts` component calls `useDataContext`
2. **Data Context**: Checks for admin-selected products
3. **API Call**: Fetches from `admin_trending_products` table
4. **Display**: Shows products in specified order

## Technical Implementation

### Error Handling
- **Netlify Function Fallback**: Direct Supabase calls if functions fail
- **Environment Detection**: Handles dev/prod differences
- **Comprehensive Logging**: Detailed console output for debugging

### Security Features
- **Row Level Security**: Admin-only access to management functions
- **Input Validation**: Prevents invalid display orders
- **Foreign Key Constraints**: Ensures artwork relationships

## Benefits

### For Admins
- **Full Control**: Choose exactly which products to feature
- **Strategic Placement**: Control product positioning
- **Easy Management**: Intuitive drag-and-drop interface
- **Real-time Preview**: See changes immediately

### For Users
- **Curated Experience**: See admin-selected highlights
- **Quality Assurance**: Only approved products displayed
- **Consistent Layout**: Maximum 8 products for clean design

## Migration Path

### From Automatic to Manual
1. **Current System**: Price-based automatic selection
2. **Transition**: Both systems run simultaneously
3. **Future State**: Admin control with automatic fallback

### Data Migration
- **Existing Behavior**: Preserved as fallback
- **Admin Override**: Takes precedence when configured
- **Seamless**: No disruption to user experience

## Troubleshooting

### Common Issues

1. **No Products Showing**
   - Check if any products are marked as `is_active = true`
   - Verify database migration was applied
   - Check console for API errors

2. **Cannot Add Products**
   - Ensure 8-product limit not exceeded
   - Verify user has admin role
   - Check if product is already in trending list

3. **Order Not Working**
   - Verify `display_order` values are 1-8
   - Check for duplicate order numbers
   - Refresh page after changes

### Debug Steps
1. Check browser console for detailed logs
2. Verify database table exists and has data
3. Test API endpoints directly
4. Check admin permissions

## Future Enhancements

Potential improvements:
- **Drag & Drop**: Visual reordering interface
- **Bulk Operations**: Select multiple products at once
- **Analytics**: Track product click-through rates
- **Scheduling**: Time-based product rotation
- **A/B Testing**: Compare different product combinations

## Integration Points

### Related Systems
- **Artworks Management**: Product approval workflow
- **Search System**: Consistent product data
- **Image Management**: Shared image handling
- **User Permissions**: Admin role management

### API Compatibility
- **Backward Compatible**: Existing systems continue working
- **Forward Compatible**: Ready for future enhancements
- **Consistent Patterns**: Follows existing codebase conventions

This system provides admins with complete control over homepage trending products while maintaining a robust fallback mechanism and excellent user experience.
