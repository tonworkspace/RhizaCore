-- Fix the claim process to properly mark mining activities as claimed
-- This ensures that claimed mining rewards cannot be claimed again

CREATE OR REPLACE FUNCTION process_secure_claim(
    p_user_id INTEGER,
    p_amount DECIMAL,
    p_operation VARCHAR,
    p_transaction_id VARCHAR,
    p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
    v_validation_result JSONB;
    v_current_balance DECIMAL;
    v_total_earned DECIMAL;
    v_claimable_amount DECIMAL := 0;
    v_activity_record RECORD;
    v_claimed_so_far DECIMAL := 0;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate the claim operation
        SELECT validate_claim_operation(p_user_id, p_amount, p_operation, p_transaction_id)
        INTO v_validation_result;

        -- Check if validation failed
        IF NOT (v_validation_result->>'success')::BOOLEAN THEN
            RETURN v_validation_result;
        END IF;

        -- Get current user balance
        SELECT available_balance, total_earned INTO v_current_balance, v_total_earned
        FROM users WHERE id = p_user_id;

        -- Calculate actual claimable amount from unclaimed mining activities
        SELECT COALESCE(SUM(amount), 0) INTO v_claimable_amount
        FROM activities 
        WHERE user_id = p_user_id 
        AND type = 'mining_complete' 
        AND status = 'completed'
        AND (metadata->>'claimed_to_airdrop' IS NULL OR metadata->>'claimed_to_airdrop' != 'true');

        -- Verify the requested amount doesn't exceed claimable amount
        IF p_amount > v_claimable_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient claimable balance',
                'requested', p_amount,
                'available', v_claimable_amount
            );
        END IF;

        -- Mark mining activities as claimed (up to the requested amount)
        FOR v_activity_record IN 
            SELECT id, amount 
            FROM activities 
            WHERE user_id = p_user_id 
            AND type = 'mining_complete' 
            AND status = 'completed'
            AND (metadata->>'claimed_to_airdrop' IS NULL OR metadata->>'claimed_to_airdrop' != 'true')
            ORDER BY created_at ASC
        LOOP
            -- Check if we've claimed enough
            EXIT WHEN v_claimed_so_far >= p_amount;
            
            -- Calculate how much to claim from this activity
            DECLARE
                v_claim_from_activity DECIMAL;
            BEGIN
                v_claim_from_activity := LEAST(v_activity_record.amount, p_amount - v_claimed_so_far);
                
                -- Mark this activity as claimed
                UPDATE activities 
                SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('claimed_to_airdrop', true, 'claimed_at', NOW())
                WHERE id = v_activity_record.id;
                
                v_claimed_so_far := v_claimed_so_far + v_claim_from_activity;
            END;
        END LOOP;

        -- Update user balance (add claimed amount to available_balance)
        UPDATE users SET
            available_balance = v_current_balance + p_amount,
            last_claim_time = NOW()
        WHERE id = p_user_id;

        -- Insert claim activity record
        INSERT INTO activities (
            user_id, 
            type, 
            amount, 
            status, 
            transaction_id,
            security_validated,
            metadata,
            created_at
        ) VALUES (
            p_user_id,
            'rzc_claim',
            p_amount,
            'completed',
            p_transaction_id,
            true,
            p_metadata || jsonb_build_object(
                'claimed_from_mining', true,
                'original_claimable', v_claimable_amount,
                'new_available_balance', v_current_balance + p_amount
            ),
            NOW()
        );

        -- Log successful claim in audit trail
        INSERT INTO claim_audit_log (
            user_id,
            operation,
            amount,
            transaction_id,
            success,
            metadata
        ) VALUES (
            p_user_id,
            p_operation,
            p_amount,
            p_transaction_id,
            true,
            jsonb_build_object(
                'validation_result', v_validation_result,
                'claimable_before', v_claimable_amount,
                'available_before', v_current_balance,
                'available_after', v_current_balance + p_amount,
                'activities_marked', v_claimed_so_far,
                'additional_metadata', p_metadata,
                'processed_at', NOW()
            )
        );

        -- Return success
        RETURN jsonb_build_object(
            'success', true,
            'transaction_id', p_transaction_id,
            'amount_claimed', p_amount,
            'new_balance', v_current_balance + p_amount,
            'claimable_before', v_claimable_amount,
            'claimable_after', v_claimable_amount - p_amount
        );

    EXCEPTION WHEN OTHERS THEN
        -- Log failed claim in audit trail
        INSERT INTO claim_audit_log (
            user_id,
            operation,
            amount,
            transaction_id,
            success,
            metadata
        ) VALUES (
            p_user_id,
            p_operation,
            p_amount,
            p_transaction_id,
            false,
            jsonb_build_object(
                'error', SQLERRM,
                'error_code', SQLSTATE,
                'claimable_amount', v_claimable_amount,
                'current_balance', v_current_balance,
                'additional_metadata', p_metadata,
                'failed_at', NOW()
            )
        );

        -- Return error
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Transaction failed: ' || SQLERRM,
            'code', 'TRANSACTION_FAILED'
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION process_secure_claim TO authenticated;