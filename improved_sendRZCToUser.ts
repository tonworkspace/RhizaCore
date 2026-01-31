// Improved sendRZCToUser function with better RLS error handling
// This can be used to replace the existing function in supabaseClient.ts

export const sendRZCToUser = async (
  fromUserId: number,
  toUserId: number,
  amount: number,
  message?: string
): Promise<{
  success: boolean;
  transferId?: number;
  error?: string;
}> => {
  try {
    // Check if sender has staked balance (requirement for sending)
    const { data: senderAirdropBalance, error: senderBalanceError } = await supabase
      .from('airdrop_balances')
      .select('staked_balance, available_balance')
      .eq('user_id', fromUserId)
      .single();

    if (senderBalanceError || !senderAirdropBalance) {
      return {
        success: false,
        error: 'Sender airdrop balance not found. Please claim your RZC to airdrop balance first.'
      };
    }

    if ((senderAirdropBalance.staked_balance || 0) <= 0) {
      return {
        success: false,
        error: 'You must have staked balance to send RZC to other users.'
      };
    }

    if ((senderAirdropBalance.available_balance || 0) < amount) {
      return {
        success: false,
        error: 'Insufficient available balance to send.'
      };
    }

    // Check if recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', toUserId)
      .single();

    if (recipientError || !recipient) {
      return {
        success: false,
        error: 'Recipient user not found.'
      };
    }

    // Create transfer record with improved error handling
    let transfer;
    try {
      const { data: transferData, error: transferError } = await supabase
        .from('user_transfers')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount: amount,
          status: 'pending',
          message: message || null,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (transferError) {
        // Handle specific RLS error
        if (transferError.code === '42501') {
          return {
            success: false,
            error: 'Transfer system is temporarily unavailable. Please contact support to enable user transfers.'
          };
        }
        throw transferError;
      }
      
      transfer = transferData;
    } catch (error: any) {
      // Handle RLS policy violations specifically
      if (error.code === '42501') {
        return {
          success: false,
          error: 'User transfer permissions need to be configured. Please contact an administrator.'
        };
      }
      throw error;
    }

    // Deduct from sender's available balance
    const { error: deductError } = await supabase
      .from('airdrop_balances')
      .update({
        available_balance: (senderAirdropBalance.available_balance || 0) - amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', fromUserId);

    if (deductError) {
      // Rollback transfer record
      await supabase.from('user_transfers').delete().eq('id', transfer.id);
      throw deductError;
    }

    // Add to recipient's airdrop balance (create if doesn't exist)
    const { data: recipientBalance, error: recipientBalanceError } = await supabase
      .from('airdrop_balances')
      .select('*')
      .eq('user_id', toUserId)
      .single();

    if (recipientBalanceError && recipientBalanceError.code === 'PGRST116') {
      // Create new airdrop balance for recipient
      const { error: createError } = await supabase
        .from('airdrop_balances')
        .insert({
          user_id: toUserId,
          total_claimed_to_airdrop: amount,
          available_balance: amount,
          withdrawn_balance: 0,
          staked_balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        // Rollback sender balance and transfer
        await supabase
          .from('airdrop_balances')
          .update({
            available_balance: senderAirdropBalance.available_balance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', fromUserId);
        await supabase.from('user_transfers').delete().eq('id', transfer.id);
        throw createError;
      }
    } else if (recipientBalanceError) {
      // Rollback sender balance and transfer
      await supabase
        .from('airdrop_balances')
        .update({
          available_balance: senderAirdropBalance.available_balance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', fromUserId);
      await supabase.from('user_transfers').delete().eq('id', transfer.id);
      throw recipientBalanceError;
    } else {
      // Update existing recipient balance
      const { error: updateError } = await supabase
        .from('airdrop_balances')
        .update({
          total_claimed_to_airdrop: (recipientBalance.total_claimed_to_airdrop || 0) + amount,
          available_balance: (recipientBalance.available_balance || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', toUserId);

      if (updateError) {
        // Rollback sender balance and transfer
        await supabase
          .from('airdrop_balances')
          .update({
            available_balance: senderAirdropBalance.available_balance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', fromUserId);
        await supabase.from('user_transfers').delete().eq('id', transfer.id);
        throw updateError;
      }
    }

    // Mark transfer as completed
    const { error: completeError } = await supabase
      .from('user_transfers')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transfer.id);

    if (completeError) {
      console.error('Error marking transfer as completed:', completeError);
      // Transfer is already processed, just log the error
    }

    // Record activities for both users
    await Promise.all([
      supabase.from('activities').insert({
        user_id: fromUserId,
        type: 'rzc_send',
        amount: -amount,
        status: 'completed',
        metadata: {
          transfer_id: transfer.id,
          recipient_id: toUserId,
          recipient_username: recipient.username,
          message: message
        },
        created_at: new Date().toISOString()
      }),
      supabase.from('activities').insert({
        user_id: toUserId,
        type: 'rzc_receive',
        amount: amount,
        status: 'completed',
        metadata: {
          transfer_id: transfer.id,
          sender_id: fromUserId,
          message: message
        },
        created_at: new Date().toISOString()
      })
    ]);

    return {
      success: true,
      transferId: transfer.id
    };
  } catch (error: any) {
    console.error('Error sending RZC to user:', error);
    
    // Provide more specific error messages based on error codes
    let errorMessage = 'Failed to send RZC to user';
    
    if (error.code === '42501') {
      errorMessage = 'Transfer permissions are not properly configured. Please contact support.';
    } else if (error.code === '23503') {
      errorMessage = 'User not found or invalid user reference.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};