export function formatTokenAmount(
  raw: bigint | string | number,
  decimals: number,
  options?: {
    maxDecimals?: number; // maximum decimals to show
    minDecimals?: number; // ensure at least this many decimals when small
    trimInsignificant?: boolean; // trim trailing zeros
    compact?: boolean; // use compact notation for large values (K/M/B)
    smartCompact?: boolean; // special rules: 1 Million (space), 20M, 200K
    smartCompactWords?: boolean; // exact words style: 1 Million, 20Million, 200K
  }
): string {
  const { maxDecimals = 6, minDecimals = 0, trimInsignificant = true, compact = false, smartCompact = false, smartCompactWords = false } = options || {};

  const rawBigInt = typeof raw === 'bigint' ? raw : BigInt(raw);
  if (decimals === 0) return rawBigInt.toString();

  const str = rawBigInt.toString().padStart(decimals + 1, '0');
  const intPart = str.slice(0, -decimals) || '0';
  const fracRaw = str.slice(-decimals);

  // Determine how many decimals to show
  const shownDecimals = Math.max(
    Math.min(maxDecimals, decimals),
    minDecimals
  );

  const frac = fracRaw.slice(0, shownDecimals);
  const base = frac ? `${intPart}.${frac}` : intPart;

  // Compact formatting for very large numbers
  const num = Number(`${intPart}.${frac}`);
  if ((compact || smartCompact || smartCompactWords) && Number.isFinite(num)) {
    if (smartCompact) {
      const abs = Math.abs(num);
      if (abs >= 1_000_000_000_000) {
        return `${(num / 1_000_000_000_000).toFixed(2).replace(/\.00$/, '')}T`;
      }
      if (abs >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`;
      }
      if (abs >= 10_000_000) {
        // 10M and above => 20M style
        return `${(num / 1_000_000).toFixed(0)}M`;
      }
      if (abs >= 1_000_000) {
        // Between 1M and 9.99M => "1 Million" style
        const val = (num / 1_000_000).toFixed(2).replace(/\.00$/, '').replace(/\.([0-9])0$/, '.$1');
        return `${val} Million`;
      }
      if (abs >= 1_000) {
        return `${(num / 1_000).toFixed(0)}K`;
      }
      // Fallback to standard formatting below
    } else if (smartCompactWords) {
      const abs = Math.abs(num);
      if (abs >= 10_000_000) {
        return `${(num / 1_000_000).toFixed(0)}Million`;
      }
      if (abs >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(0)} Million`;
      }
      if (abs >= 1_000) {
        return `${(num / 1_000).toFixed(0)}K`;
      }
      // else fall through
    } else if (compact) {
      return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: Math.min(2, shownDecimals) }).format(num);
    }
  }

  // Add thousand separators and trim zeros
  const [i, f] = base.split('.');
  const withSep = Number.isFinite(Number(i))
    ? `${Number(i).toLocaleString(undefined)}`
    : i;

  if (!f) return withSep;

  const fractional = trimInsignificant ? f.replace(/0+$/, '') : f;
  return fractional ? `${withSep}.${fractional}` : withSep;
}

export const formatTonValue = (value: string | number | bigint): string => {
  const n = typeof value === 'bigint' ? Number(value) : Number(value);
  return (n / 1e9).toFixed(2);
};