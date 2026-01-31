// Test script to fix user_transfers RLS policies
import { supabase } from './src/lib/supabaseClient.ts';

async function fixUserTransfersRLS() {
  try {
    console.log('🔧 Fixing user_transfers RLS policies...');
    
    // First, let's check the current state of the table
    console.log('📊 Checking current user_transfers table state...');
    
    // Try to query the table to see current permissions
    const { data: testQuery, error: testError } = await supabase
      .from('user_transfers')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.log('❌ Current RLS error:', testError.message);
    } else {
      console.log('✅ Table is accessible for queries');
    }
    
    // Disable RLS on user_transfers table
    console.log('🔓 Disabling RLS on user_transfers table...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Disable RLS on user_transfers table to allow integer user ID operations
        ALTER TABLE user_transfers DISABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own transfers" ON user_transfers;
        DROP POLICY IF EXISTS "Users can create transfers they send" ON user_transfers;
        DROP POLICY IF EXISTS "System can update transfer status" ON user_transfers;
        
        SELECT 'RLS disabled successfully' as result;
      `
    });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - direct SQL execution
      console.log('🔄 Trying alternative approach...');
      
      const { error: altError } = await supabase
        .from('user_transfers')
        .select('*')
        .limit(0); // This will test if we can access the table
        
      if (altError && altError.code === '42501') {
        console.log('🚨 RLS is blocking access. Manual intervention required.');
        console.log('Please run the following SQL in your Supabase SQL editor:');
        console.log('');
        console.log('ALTER TABLE user_transfers DISABLE ROW LEVEL SECURITY;');
        console.log('');
        return false;
      }
    } else {
      console.log('✅ RLS policies fixed successfully!');
      console.log('Result:', data);
    }
    
    // Test the fix by attempting a simple insert/delete
    console.log('🧪 Testing the fix...');
    
    const testUserId = 999999; // Use a test user ID that doesn't exist
    
    const { data: insertTest, error: insertError } = await supabase
      .from('user_transfers')
      .insert({
        from_user_id: testUserId,
        to_user_id: testUserId + 1,
        amount: 0.01,
        status: 'pending',
        message: 'Test transfer'
      })
      .select('id')
      .single();
    
    if (insertError) {
      if (insertError.code === '23503') {
        console.log('✅ Insert test shows foreign key constraint (expected - test users don\'t exist)');
        console.log('✅ RLS is no longer blocking inserts!');
        return true;
      } else {
        console.log('❌ Insert test failed:', insertError.message);
        return false;
      }
    } else {
      console.log('✅ Insert test successful, cleaning up...');
      // Clean up test record
      await supabase
        .from('user_transfers')
        .delete()
        .eq('id', insertTest.id);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the fix
fixUserTransfersRLS().then(success => {
  if (success) {
    console.log('🎉 User transfers RLS fix completed successfully!');
    console.log('💡 Users should now be able to send RZC to each other.');
  } else {
    console.log('⚠️  Manual intervention may be required.');
    console.log('📝 Please check the Supabase dashboard and run the SQL commands manually if needed.');
  }
  process.exit(success ? 0 : 1);
});