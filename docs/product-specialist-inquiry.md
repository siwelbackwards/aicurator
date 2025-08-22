# Product Specialist Inquiry Feature

## Overview
Added an "Ask a Product Specialist" button on individual product pages that allows users to easily contact the AI Curator team via email for detailed inquiries about specific artworks.

## Implementation Details

### Location
- **File**: `app/product/[id]/product-client.tsx`
- **Button Position**: Below the "Buy Now" and "Add to wishlist" buttons
- **Email Address**: `aicuratorinfo@gmail.com`

### Features
1. **Pre-filled Email**: Opens user's default email client with:
   - Subject: "Inquiry about '[Product Title]' (Product ID: [ID])"
   - Body: Template with product details and common inquiry points

2. **Product Context**: Email includes:
   - Product title and ID
   - Artist name
   - Current price
   - Request for condition report, authentication, shipping, and payment info

3. **User-Friendly**: Uses mailto link that works across all devices and email clients

### UI Elements
- **Button Style**: Secondary variant, full width
- **Icon**: Mail icon from Lucide React
- **Text**: "Ask a Product Specialist"

### Code Changes
1. Added `Mail` icon import
2. Created `handleContactSpecialist` function with email template
3. Added button to product info section

## Usage
Users can now click the "Ask a Product Specialist" button on any product page to:
- Get detailed information about artworks
- Ask about condition reports
- Inquire about authentication and provenance
- Get shipping and delivery information
- Discuss payment terms

This feature provides a direct communication channel between potential buyers and the AI Curator specialist team, improving customer service and sales conversion.
