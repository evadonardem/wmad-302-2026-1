
/**
 * Payment Methods Storage
 *
 * CartlyX - Account-specific local payment storage.
 *
 * Security:
 * - Stores cardholder name, brand, last four digits,
 *   expiration date, and default status only.
 * - Never stores full card numbers or CVV.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserId } from '@/types/auth';
import type { PaymentMethod } from '@/types/payment';

const getPaymentMethodsKey = (userId: UserId): string =>
  `cartlyx_payment_methods_${encodeURIComponent(String(userId))}`;

async function readMethods(userId: UserId): Promise<PaymentMethod[]> {
  try {
    const stored = await AsyncStorage.getItem(
      getPaymentMethodsKey(userId),
    );

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed)
      ? (parsed as PaymentMethod[])
      : [];
  } catch (error) {
    console.error('Failed to load payment methods:', error);
    return [];
  }
}

async function writeMethods(
  userId: UserId,
  methods: PaymentMethod[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      getPaymentMethodsKey(userId),
      JSON.stringify(methods),
    );
  } catch (error) {
    console.error('Failed to save payment methods:', error);
    throw error;
  }
}

export const paymentMethodsStorage = {
  getAll: async (userId: UserId): Promise<PaymentMethod[]> => {
    const methods = await readMethods(userId);

    return [...methods].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;

      return (
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
      );
    });
  },

  add: async (
    userId: UserId,
    method: PaymentMethod,
  ): Promise<void> => {
    const methods = await readMethods(userId);

    const shouldBeDefault =
      methods.length === 0 || method.isDefault;

    const updatedMethods = [
      ...methods.map((item) => ({
        ...item,
        isDefault: shouldBeDefault ? false : item.isDefault,
      })),
      {
        ...method,
        isDefault: shouldBeDefault,
      },
    ];

    await writeMethods(userId, updatedMethods);
  },

  update: async (
    userId: UserId,
    methodId: string,
    updates: Pick<
      PaymentMethod,
      'cardholderName' | 'expiryMonth' | 'expiryYear'
    >,
  ): Promise<void> => {
    const methods = await readMethods(userId);

    const updatedMethods = methods.map((method) =>
      method.id === methodId
        ? { ...method, ...updates }
        : method,
    );

    await writeMethods(userId, updatedMethods);
  },

  setDefault: async (
    userId: UserId,
    methodId: string,
  ): Promise<void> => {
    const methods = await readMethods(userId);

    const updatedMethods = methods.map((method) => ({
      ...method,
      isDefault: method.id === methodId,
    }));

    await writeMethods(userId, updatedMethods);
  },

  remove: async (
    userId: UserId,
    methodId: string,
  ): Promise<void> => {
    const methods = await readMethods(userId);

    let updatedMethods = methods.filter(
      (method) => method.id !== methodId,
    );

    // If the default method was removed, select the first
    // remaining method as the new default.
    if (
      methods.some(
        (method) => method.id === methodId && method.isDefault,
      ) &&
      updatedMethods.length > 0
    ) {
      updatedMethods = updatedMethods.map((method, index) => ({
        ...method,
        isDefault: index === 0,
      }));
    }

    await writeMethods(userId, updatedMethods);
  },
};
