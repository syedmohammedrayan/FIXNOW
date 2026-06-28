/**
 * Memory Bank ID Generators
 * 
 * Generates scoped bank identifiers for Hindsight Cloud.
 * Never hardcode bank IDs — always use these helpers.
 */

const PREFIX = process.env.HINDSIGHT_BANK_PREFIX || 'fixnow';

export function customerBank(userId: string): string {
  return `${PREFIX}-customer-${userId}`;
}

export function technicianBank(userId: string): string {
  return `${PREFIX}-technician-${userId}`;
}

export function adminBank(): string {
  return `${PREFIX}-admin`;
}

export function systemBank(): string {
  return `${PREFIX}-system`;
}
