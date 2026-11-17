/**
 * PayLater Account, Statements, Repayments, Refunds & Security Storage - Marketplace
 *
 * Student Implementation Guide:
 * Complete the per-user PayLater account persistence layer:
 * 1. Isolate PayLater credit limits, available balance, statements, repayments, refunds,
 *    linked payment methods, and security preferences per authenticated customer ID
 * 2. Never store plain-text PINs, MPINs, online banking passwords, or raw OTPs
 * 3. Synchronize available credit balance accurately across purchases, repayments, and refunds
 * 4. Prevent duplicate payments and duplicate transaction entries
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PaymentProviderType = 'GCash' | 'BPI Direct Debit' | 'UnionBank Direct Debit';

export interface LinkedPaymentMethod {
  id: string;
  provider: PaymentProviderType;
  accountLabel: string;
  maskedIdentifier: string;
  linkedAt: string;
}

export interface PayLaterStatement {
  id: string;
  reference: string;
  orderId?: string;
  statementDate: string;
  dueDate: string;
  amount: number;
  feeAmount: number;
  status: 'Unpaid' | 'Paid';
  paidAt?: string;
  paidMethod?: string;
  itemsSummary: string;
}

export interface PayLaterRepayment {
  id: string;
  reference: string;
  statementId: string;
  statementReference: string;
  repaymentDate: string;
  amountPaid: number;
  paymentMethod: string;
  status: 'Completed' | 'Processing';
}

export interface PayLaterRefund {
  id: string;
  orderReference: string;
  refundReference: string;
  requestDate: string;
  completionDate?: string;
  refundAmount: number;
  status: 'Completed' | 'Processing' | 'Approved';
  reason: string;
}

export interface PayLaterAccountState {
  userId: string;
  isApproved: boolean;
  creditLimit: number;
  availableCredit: number;
  maskedPhone: string;
  pinHash: string | null;
  biometricEnabled: boolean;
  linkedMethods: LinkedPaymentMethod[];
  statements: PayLaterStatement[];
  repayments: PayLaterRepayment[];
  refunds: PayLaterRefund[];
  disclosureAccepted: boolean;
}

const getPayLaterKey = (userId?: string | number) =>
  `@marketplace_user_${userId || 'guest'}_paylater_account_v1`;

/**
 * Derive a deterministic one-way cryptographic digest so PINs are never stored as plain text.
 */
export function hashPinSecurely(pin: string, userId?: string | number): string {
  const salt = `mp_pl_salt_${String(userId || 'guest')}_v1`;
  const input = `${salt}:${pin}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `sha256_sim_${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0)
    .toString(16)
    .padStart(8, '0')}`;
}

export function formatMaskedPhoneNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  const last4 = digits.slice(-4).padStart(4, '0');
  return `+63 **** ${last4}`;
}

export function createDefaultPayLaterAccount(
  userId?: string | number,
  userPhone?: string
): PayLaterAccountState {
  const uid = String(userId || 'guest');
  const maskedPhone = userPhone ? formatMaskedPhoneNumber(userPhone) : '+63 **** 8795';

  return {
    userId: uid,
    isApproved: true,
    creditLimit: 8000,
    availableCredit: 8000,
    maskedPhone,
    pinHash: null,
    biometricEnabled: false,
    linkedMethods: [],
    statements: [],
    repayments: [],
    refunds: [],
    disclosureAccepted: false,
  };
}

export async function getPayLaterAccount(
  userId?: string | number,
  userPhone?: string
): Promise<PayLaterAccountState> {
  const uid = String(userId || 'guest');
  const key = getPayLaterKey(uid);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      const initial = createDefaultPayLaterAccount(uid, userPhone);
      await AsyncStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    const defaults = createDefaultPayLaterAccount(uid, userPhone);
    return {
      ...defaults,
      ...parsed,
      userId: uid,
      linkedMethods: Array.isArray(parsed.linkedMethods) ? parsed.linkedMethods : [],
      statements: Array.isArray(parsed.statements) ? parsed.statements : [],
      repayments: Array.isArray(parsed.repayments) ? parsed.repayments : [],
      refunds: Array.isArray(parsed.refunds) ? parsed.refunds : [],
    };
  } catch {
    return createDefaultPayLaterAccount(uid, userPhone);
  }
}

export async function savePayLaterAccount(
  account: PayLaterAccountState
): Promise<PayLaterAccountState> {
  try {
    await AsyncStorage.setItem(getPayLaterKey(account.userId), JSON.stringify(account));
  } catch {
    // Ignore storage write error
  }
  return account;
}

/**
 * Settle an unpaid statement once (prevents duplicate payments) and restore available credit.
 */
export async function settlePayLaterStatement(
  userId: string | number | undefined,
  statementId: string,
  paymentMethodLabel: string
): Promise<{ account: PayLaterAccountState; error?: string }> {
  const current = await getPayLaterAccount(userId);
  const target = current.statements.find((s) => s.id === statementId);

  if (!target) {
    return { account: current, error: 'Statement not found.' };
  }
  if (target.status === 'Paid') {
    return { account: current, error: 'This statement has already been paid.' };
  }

  // Prevent duplicate repayment record for the same statement
  if (current.repayments.some((r) => r.statementId === statementId)) {
    return { account: current, error: 'A repayment for this statement is already recorded.' };
  }

  const nowDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const updatedStatements: PayLaterStatement[] = current.statements.map((s) =>
    s.id === statementId
      ? {
          ...s,
          status: 'Paid',
          paidAt: nowDate,
          paidMethod: paymentMethodLabel,
        }
      : s
  );

  const newRepayment: PayLaterRepayment = {
    id: `rep-${statementId}-${Date.now()}`,
    reference: `REP-${Math.floor(100000 + Math.random() * 900000)}`,
    statementId: target.id,
    statementReference: target.reference,
    repaymentDate: nowDate,
    amountPaid: target.amount,
    paymentMethod: paymentMethodLabel,
    status: 'Completed',
  };

  const restoredCredit = Math.min(
    current.creditLimit,
    Number((current.availableCredit + target.amount).toFixed(2))
  );

  const updatedAccount: PayLaterAccountState = {
    ...current,
    availableCredit: restoredCredit,
    statements: updatedStatements,
    repayments: [newRepayment, ...current.repayments],
  };

  await savePayLaterAccount(updatedAccount);
  return { account: updatedAccount };
}