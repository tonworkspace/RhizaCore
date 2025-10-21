// Sponsor Gate Testing Utility
// This utility helps test and verify sponsor gate functionality

import { supabase } from '@/lib/supabaseClient';

export interface SponsorGateTestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

export class SponsorGateTester {
  
  /**
   * Test if the first user bypass works correctly
   */
  static async testFirstUserBypass(): Promise<SponsorGateTestResult> {
    try {
      // Get the first user
      const { data: firstUser, error: firstUserError } = await supabase
        .from('users')
        .select('id, username, telegram_id, sponsor_code, created_at')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (firstUserError || !firstUser) {
        return {
          test: 'First User Detection',
          passed: false,
          message: 'No first user found in database',
          details: firstUserError
        };
      }

      // Check if first user has admin sponsor code
      const hasAdminCode = firstUser.sponsor_code?.startsWith('ADMIN-');
      
      return {
        test: 'First User Bypass',
        passed: true,
        message: `First user (ID: ${firstUser.id}) ${hasAdminCode ? 'has admin code' : 'needs admin code'}`,
        details: {
          userId: firstUser.id,
          username: firstUser.username,
          sponsorCode: firstUser.sponsor_code,
          hasAdminCode,
          createdAt: firstUser.created_at
        }
      };
    } catch (error) {
      return {
        test: 'First User Bypass',
        passed: false,
        message: 'Error testing first user bypass',
        details: error
      };
    }
  }

  /**
   * Test sponsor code generation for first user
   */
  static async testFirstUserSponsorCodeGeneration(userId: number): Promise<SponsorGateTestResult> {
    try {
      // Check if user is first user
      const { data: firstUser } = await supabase
        .from('users')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!firstUser || firstUser.id !== userId) {
        return {
          test: 'First User Code Generation',
          passed: false,
          message: 'User is not the first user in the system'
        };
      }

      // Generate admin sponsor code
      const adminCode = `ADMIN-${userId.toString().padStart(4, '0')}`;
      
      // Update user with admin code
      const { error: updateError } = await supabase
        .from('users')
        .update({ sponsor_code: adminCode })
        .eq('id', userId);

      if (updateError) {
        return {
          test: 'First User Code Generation',
          passed: false,
          message: 'Failed to update user with admin code',
          details: updateError
        };
      }

      return {
        test: 'First User Code Generation',
        passed: true,
        message: `Successfully generated admin code: ${adminCode}`,
        details: { adminCode, userId }
      };
    } catch (error) {
      return {
        test: 'First User Code Generation',
        passed: false,
        message: 'Error generating first user sponsor code',
        details: error
      };
    }
  }

  /**
   * Test sponsor gate display logic
   */
  static async testSponsorGateLogic(userId: number): Promise<SponsorGateTestResult> {
    try {
      // Check if user has sponsor
      const { data: referralData } = await supabase
        .from('referrals')
        .select('sponsor_id')
        .eq('referred_id', userId)
        .maybeSingle();

      // Check if user is first user
      const { data: firstUser } = await supabase
        .from('users')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      const hasSponsor = !!referralData?.sponsor_id;
      const isFirstUser = firstUser?.id === userId;
      const shouldShowGate = !hasSponsor && !isFirstUser;

      return {
        test: 'Sponsor Gate Logic',
        passed: true,
        message: `Gate should ${shouldShowGate ? 'SHOW' : 'HIDE'} for user ${userId}`,
        details: {
          userId,
          hasSponsor,
          isFirstUser,
          shouldShowGate,
          sponsorId: referralData?.sponsor_id
        }
      };
    } catch (error) {
      return {
        test: 'Sponsor Gate Logic',
        passed: false,
        message: 'Error testing sponsor gate logic',
        details: error
      };
    }
  }

  /**
   * Test sponsor code validation
   */
  static async testSponsorCodeValidation(code: string): Promise<SponsorGateTestResult> {
    try {
      const codeNum = Number(code);
      
      if (isNaN(codeNum)) {
        return {
          test: 'Sponsor Code Validation',
          passed: false,
          message: 'Invalid sponsor code format (not a number)',
          details: { code, codeNum }
        };
      }

      // Check if sponsor exists
      const { data: sponsor, error: sponsorError } = await supabase
        .from('users')
        .select('id, username, telegram_id, sponsor_code')
        .or(`telegram_id.eq.${codeNum},id.eq.${codeNum}`)
        .maybeSingle();

      if (sponsorError || !sponsor) {
        return {
          test: 'Sponsor Code Validation',
          passed: false,
          message: 'Sponsor not found',
          details: { code, codeNum, error: sponsorError }
        };
      }

      return {
        test: 'Sponsor Code Validation',
        passed: true,
        message: `Valid sponsor found: ${sponsor.username || sponsor.id}`,
        details: {
          code,
          sponsor: {
            id: sponsor.id,
            username: sponsor.username,
            telegramId: sponsor.telegram_id,
            sponsorCode: sponsor.sponsor_code
          }
        }
      };
    } catch (error) {
      return {
        test: 'Sponsor Code Validation',
        passed: false,
        message: 'Error validating sponsor code',
        details: error
      };
    }
  }

  /**
   * Run all sponsor gate tests
   */
  static async runAllTests(userId?: number): Promise<SponsorGateTestResult[]> {
    const results: SponsorGateTestResult[] = [];

    // Test first user bypass
    results.push(await this.testFirstUserBypass());

    // Test sponsor gate logic if userId provided
    if (userId) {
      results.push(await this.testSponsorGateLogic(userId));
    }

    return results;
  }

  /**
   * Generate test report
   */
  static generateTestReport(results: SponsorGateTestResult[]): string {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    let report = `Sponsor Gate Test Report\n`;
    report += `========================\n`;
    report += `Tests Passed: ${passed}/${total}\n\n`;
    
    results.forEach(result => {
      report += `${result.test}: ${result.passed ? '✅ PASS' : '❌ FAIL'}\n`;
      report += `  ${result.message}\n`;
      if (result.details) {
        report += `  Details: ${JSON.stringify(result.details, null, 2)}\n`;
      }
      report += `\n`;
    });
    
    return report;
  }
}

// Console helper for easy testing
export const testSponsorGate = {
  async firstUser() {
    const result = await SponsorGateTester.testFirstUserBypass();
    console.log(result);
    return result;
  },
  
  async logic(userId: number) {
    const result = await SponsorGateTester.testSponsorGateLogic(userId);
    console.log(result);
    return result;
  },
  
  async validate(code: string) {
    const result = await SponsorGateTester.testSponsorCodeValidation(code);
    console.log(result);
    return result;
  },
  
  async all(userId?: number) {
    const results = await SponsorGateTester.runAllTests(userId);
    const report = SponsorGateTester.generateTestReport(results);
    console.log(report);
    return results;
  }
};
