/**
 * TON Balance Service
 * Handles fetching, caching, and managing TON wallet balances
 */

export interface TONBalanceResult {
  success: boolean;
  balance?: number;
  balanceFormatted?: string;
  usdValue?: number;
  error?: string;
  cached?: boolean;
  timestamp?: number;
}

interface BalanceCacheEntry {
  address: string;
  balance: number;
  usdValue: number;
  timestamp: number;
  expiresAt: number;
}

interface TONAPIResponse {
  balance: string; // Balance in nanotons
  status: string;
  last_activity: number;
}

class TONBalanceService {
  private cache = new Map<string, BalanceCacheEntry>();
  private pendingRequests = new Map<string, Promise<TONBalanceResult>>();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds
  private readonly REQUEST_TIMEOUT = 10 * 1000; // 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000; // 1 second

  /**
   * Fetch TON balance for a given address
   */
  async fetchBalance(address: string, tonPrice: number = 0): Promise<TONBalanceResult> {
    if (!address || !this.isValidTONAddress(address)) {
      return {
        success: false,
        error: 'Invalid TON address',
        timestamp: Date.now()
      };
    }

    // Check cache first
    const cached = this.getCachedBalance(address);
    if (cached && cached.success) {
      return cached;
    }

    // Check for pending request to avoid duplicates
    const pendingKey = address.toLowerCase();
    if (this.pendingRequests.has(pendingKey)) {
      return await this.pendingRequests.get(pendingKey)!;
    }

    // Create new request
    const requestPromise = this.performBalanceFetch(address, tonPrice);
    this.pendingRequests.set(pendingKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(pendingKey);
    }
  }

  /**
   * Get cached balance if available and not expired
   */
  getCachedBalance(address: string): TONBalanceResult | null {
    const cacheKey = address.toLowerCase();
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return {
      success: true,
      balance: cached.balance,
      balanceFormatted: this.formatBalance(cached.balance),
      usdValue: cached.usdValue,
      cached: true,
      timestamp: cached.timestamp
    };
  }

  /**
   * Clear cache for specific address or all addresses
   */
  clearCache(address?: string): void {
    if (address) {
      this.cache.delete(address.toLowerCase());
    } else {
      this.cache.clear();
    }
  }

  /**
   * Perform the actual balance fetch with retry logic
   */
  private async performBalanceFetch(address: string, tonPrice: number): Promise<TONBalanceResult> {
    let lastError: string = '';
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.fetchFromAPI(address, tonPrice);
        
        if (result.success && result.balance !== undefined) {
          // Cache successful result
          this.cacheBalance(address, result.balance, result.usdValue || 0);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // Wait before retry (exponential backoff)
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.BASE_DELAY * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: `Failed after ${this.MAX_RETRIES} attempts: ${lastError}`,
      timestamp: Date.now()
    };
  }

  /**
   * Fetch balance from TON API
   */
  private async fetchFromAPI(address: string, tonPrice: number): Promise<TONBalanceResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(`https://tonapi.io/v2/accounts/${address}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: TONAPIResponse = await response.json();
      
      // Convert nanotons to TON (1 TON = 1e9 nanotons)
      const balanceInTON = parseInt(data.balance) / 1e9;
      const usdValue = balanceInTON * tonPrice;

      return {
        success: true,
        balance: balanceInTON,
        balanceFormatted: this.formatBalance(balanceInTON),
        usdValue: usdValue,
        timestamp: Date.now()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Cache balance data
   */
  private cacheBalance(address: string, balance: number, usdValue: number): void {
    const cacheKey = address.toLowerCase();
    const now = Date.now();
    
    this.cache.set(cacheKey, {
      address: cacheKey,
      balance,
      usdValue,
      timestamp: now,
      expiresAt: now + this.CACHE_TTL
    });
  }

  /**
   * Format balance for display
   */
  private formatBalance(balance: number): string {
    if (balance === 0) return '0.00';
    if (balance < 0.01) return balance.toFixed(6);
    if (balance < 1) return balance.toFixed(4);
    if (balance < 1000) return balance.toFixed(2);
    
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Validate TON address format
   */
  private isValidTONAddress(address: string): boolean {
    // Basic TON address validation
    // TON addresses are typically 48 characters long and contain base64url characters
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Remove any whitespace
    address = address.trim();
    
    // Check length (TON addresses are usually 48 characters)
    if (address.length !== 48) {
      return false;
    }

    // Check for valid base64url characters
    const base64urlPattern = /^[A-Za-z0-9_-]+$/;
    return base64urlPattern.test(address);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Background refresh for cached data approaching expiration
   */
  async backgroundRefresh(address: string, tonPrice: number): Promise<void> {
    const cached = this.cache.get(address.toLowerCase());
    if (!cached) return;

    const now = Date.now();
    const timeUntilExpiry = cached.expiresAt - now;
    
    // Refresh if less than 10 seconds until expiry
    if (timeUntilExpiry < 10000) {
      try {
        await this.fetchBalance(address, tonPrice);
      } catch (error) {
        console.warn('Background refresh failed:', error);
      }
    }
  }
}

// Export singleton instance
export const tonBalanceService = new TONBalanceService();
export default tonBalanceService;