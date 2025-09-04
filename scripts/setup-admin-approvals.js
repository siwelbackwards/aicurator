#!/usr/bin/env node

/**
 * Admin Approval System Setup Script
 * This script ensures all admin users are approved and verifies the system is working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureAdminApprovals() {
  console.log('🔧 Ensuring all admin users are approved...\n');

  try {
    // Get all admin users
    const { data: admins, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, user_status, role')
      .eq('role', 'admin');

    if (fetchError) {
      console.error('❌ Error fetching admin users:', fetchError.message);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('ℹ️  No admin users found in the system');
      return;
    }

    console.log(`📊 Found ${admins.length} admin user(s):\n`);

    admins.forEach(admin => {
      console.log(`  • ${admin.email}: ${admin.user_status || 'not set'}`);
    });

    // Update any non-approved admins
    const adminsToUpdate = admins.filter(admin =>
      !admin.user_status || admin.user_status !== 'approved'
    );

    if (adminsToUpdate.length === 0) {
      console.log('\n✅ All admin users are already approved!');
      return;
    }

    console.log(`\n🔄 Updating ${adminsToUpdate.length} admin user(s)...`);

    for (const admin of adminsToUpdate) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_status: 'approved',
          status_changed_at: new Date().toISOString(),
          status_changed_by: admin.id,
          admin_notes: 'Auto-approved for admin role'
        })
        .eq('id', admin.id);

      if (updateError) {
        console.error(`❌ Error updating ${admin.email}:`, updateError.message);
      } else {
        console.log(`✅ Updated ${admin.email} to approved status`);
      }
    }

    console.log('\n🎉 Admin approval setup complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function verifySystem() {
  console.log('\n🔍 Verifying approval system components...\n');

  try {
    // Check if pending_users view exists by trying to query it
    const { data: pendingUsers, error: viewError } = await supabase
      .from('pending_users')
      .select('count')
      .limit(1);

    if (viewError) {
      console.log('⚠️  Warning: pending_users view may not exist');
      console.log('   This is normal if the migration hasn\'t run yet');
    } else {
      console.log('✅ pending_users view is accessible');
    }

    // Check admin users count
    const { data: adminStats, error: adminError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('role', 'admin');

    if (adminError) {
      console.log('⚠️  Warning: Could not check admin users');
    } else {
      console.log(`✅ Found ${adminStats?.length || 0} admin user(s)`);
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Run database migrations if not already done');
    console.log('2. Visit /admin/approvals to review pending users');
    console.log('3. All admin users should now have approved status');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

// Run the setup
async function main() {
  console.log('🚀 AI Curator Admin Approval System Setup\n');

  await ensureAdminApprovals();
  await verifySystem();

  console.log('\n✨ Setup complete! Visit /admin to access the approval system.');
}

main().catch(console.error);
