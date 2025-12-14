export const formatBalance = (balance: string): string => {
  const num = parseFloat(balance);
  if (num < 0.0001) {
    return '< 0.0001';
  }
  return num.toFixed(4);
};

export const truncateAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};