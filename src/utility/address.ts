import { Address } from "@ton/core";

export function isValidAddress(address: string): boolean {
  try {
    // Try to parse the address using TON's Address class
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
} 